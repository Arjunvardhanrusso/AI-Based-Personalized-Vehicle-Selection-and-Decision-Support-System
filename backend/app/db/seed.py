import os
import json
import logging
from sqlalchemy.orm import Session
from .database import engine, Base, SessionLocal
from .models import User, VehicleModel, VehicleVariantModel, VehiclePriceModel
from ..core.security import get_password_hash

logger = logging.getLogger("seed")
logging.basicConfig(level=logging.INFO)

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
_DATA_DIR = os.path.join(_BASE_DIR, "data")

def seed_database(db: Session = None, force_refresh: bool = False):
    """Seed vehicles, variants, prices and default users into the database."""
    should_close = False
    if db is None:
        if force_refresh:
            Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        # 1. Seed Default Users
        admin_user = db.query(User).filter(User.email == "admin@vehicleiq.ai").first()
        if not admin_user:
            admin = User(
                email="admin@vehicleiq.ai",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                is_active=True
            )
            db.add(admin)
            logger.info("Admin user created: admin@vehicleiq.ai / admin123")

        demo_user = db.query(User).filter(User.email == "demo@vehicleiq.ai").first()
        if not demo_user:
            demo = User(
                email="demo@vehicleiq.ai",
                hashed_password=get_password_hash("demo123"),
                is_admin=False,
                is_active=True
            )
            db.add(demo)
            logger.info("Demo user created: demo@vehicleiq.ai / demo123")

        db.commit()

        # Check if vehicles already seeded
        existing_vehicles_count = db.query(VehicleModel).count()
        if existing_vehicles_count > 0 and not force_refresh:
            logger.info(f"Database already seeded with {existing_vehicles_count} vehicles.")
            return

        # 2. Seed Base Vehicles
        vehicles_path = os.path.join(_DATA_DIR, "vehicles.json")
        seen_vehicle_ids = set()
        if os.path.exists(vehicles_path):
            with open(vehicles_path, "r", encoding="utf-8") as f:
                vdata = json.load(f).get("vehicles", [])
            
            for v in vdata:
                vid = v.get("id")
                if not vid or vid in seen_vehicle_ids:
                    continue
                seen_vehicle_ids.add(vid)

                brand = v.get("brand", "Unknown")
                model_name = v.get("name", "Unknown")
                brand_prefix = f"{brand.lower()} "
                if model_name.lower().startswith(brand_prefix):
                    model_name = model_name[len(brand_prefix):].strip()

                vehicle_obj = VehicleModel(
                    id=vid,
                    brand=brand,
                    model_family=v.get("model_family", model_name),
                    model_name=model_name,
                    body_type=v.get("vehicle_segment", v.get("body_type", "Hatchback")),
                    vehicle_type=v.get("vehicle_segment", "Car"),
                    year_introduced=v.get("year_introduced", 2024),
                    description=v.get("description", "")
                )
                db.add(vehicle_obj)
            db.commit()
            logger.info(f"Seeded {len(seen_vehicle_ids)} base vehicles.")

        # 3. Seed Variants
        variants_path = os.path.join(_DATA_DIR, "variants.json")
        seen_variant_ids = set()
        if os.path.exists(variants_path):
            with open(variants_path, "r", encoding="utf-8") as f:
                var_data = json.load(f).get("variants", [])

            for var in var_data:
                var_id = var.get("id")
                if not var_id or var_id in seen_variant_ids:
                    continue
                
                vid = var.get("vehicle_id")
                if vid not in seen_vehicle_ids:
                    continue

                seen_variant_ids.add(var_id)

                tx_list = var.get("transmission", ["manual"])
                tx_str = ",".join(tx_list) if isinstance(tx_list, list) else str(tx_list)
                features_list = var.get("features", [])
                features_str = json.dumps(features_list) if isinstance(features_list, list) else str(features_list)

                variant_obj = VehicleVariantModel(
                    id=var_id,
                    vehicle_id=vid,
                    brand=var.get("brand", ""),
                    model_family=var.get("model_family", ""),
                    model_name=var.get("model_name", ""),
                    variant_name=var.get("variant_name", "Standard"),
                    fuel_type=var.get("fuel_type", "petrol"),
                    powertrain_type=var.get("powertrain_type", "Petrol"),
                    transmission=tx_str,
                    price_inr=float(var.get("price_inr", 0)),
                    is_used=bool(var.get("is_used", False)),
                    used_price_inr=var.get("used_price_inr"),
                    body_type=var.get("body_type", "Hatchback"),
                    vehicle_type=var.get("vehicle_type", "Car"),
                    performance_type=var.get("performance_type", "Standard"),
                    engine_cc=var.get("engine_cc"),
                    power_bhp=var.get("power_bhp"),
                    torque_nm=var.get("torque_nm"),
                    seating_capacity=int(var.get("seating_capacity", 5)),
                    boot_space_litres=int(var.get("boot_space_litres", 350)),
                    ground_clearance_mm=int(var.get("ground_clearance_mm", 170)),
                    features=features_str,
                    ncap_rating=var.get("ncap_rating"),
                    has_adas=bool(var.get("has_adas", False)),
                    has_360_camera=bool(var.get("has_360_camera", False)),
                    running_cost_per_km=float(var.get("running_cost_per_km", 6.0)),
                    maintenance_index=float(var.get("maintenance_index", 0.3)),
                )
                db.add(variant_obj)
            db.commit()
            logger.info(f"Seeded {len(seen_variant_ids)} vehicle variants.")

        # 4. Seed Prices
        prices_path = os.path.join(_DATA_DIR, "prices.json")
        if os.path.exists(prices_path):
            with open(prices_path, "r", encoding="utf-8") as f:
                pdata = json.load(f).get("prices", [])

            # Batch insert prices for performance
            price_objs = []
            seen_price_keys = set()
            for p in pdata:
                v_id = p.get("vehicle_variant_id")
                if v_id in seen_variant_ids:
                    pkey = (v_id, p.get("state", "").lower(), str(p.get("city", "")).lower())
                    if pkey in seen_price_keys:
                        continue
                    seen_price_keys.add(pkey)

                    price_objs.append(VehiclePriceModel(
                        vehicle_variant_id=v_id,
                        state=p.get("state", "Delhi"),
                        city=p.get("city"),
                        ex_showroom_price_inr=float(p.get("ex_showroom_price_inr", 0)),
                        effective_from=p.get("effective_from"),
                        effective_to=p.get("effective_to"),
                        source=p.get("source"),
                        last_verified=p.get("last_verified"),
                        is_verified=bool(p.get("is_verified", True))
                    ))
                    if len(price_objs) >= 1000:
                        db.bulk_save_objects(price_objs)
                        db.commit()
                        price_objs = []
            if price_objs:
                db.bulk_save_objects(price_objs)
                db.commit()
            logger.info(f"Seeded {len(seen_price_keys)} location prices.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}", exc_info=True)
        raise
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    seed_database(force_refresh=True)
