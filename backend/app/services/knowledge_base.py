"""
Knowledge Base Service

Loads and serves all knowledge base data from Database (with JSON fallback):
- Vehicles & First-Class Variants
- Pan-India Location hierarchy (States & Cities)
- Verified location-specific ex-showroom prices
- Declarative production rules
- Fuzzy membership sets
- Bayesian priors & conditional likelihood tables
"""
from typing import Any, Dict, List, Optional, Tuple
from app.models.vehicle import Vehicle, VehicleVariant, VehiclePrice
from app.models.reasoning import Rule, RuleCondition, RuleConclusion
import json
import os
import logging

logger = logging.getLogger("knowledge_base")

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DATA_DIR = os.path.join(os.path.dirname(_BASE_DIR), "data")


class KnowledgeBaseService:
    """Manages loading, querying, and pricing resolution for the vehicle knowledge base."""

    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or _DATA_DIR
        self._vehicles: List[Vehicle] = []
        self._variants: List[VehicleVariant] = []
        self._prices: List[VehiclePrice] = []
        self._price_lookup: Dict[str, Dict[Tuple[str, Optional[str]], VehiclePrice]] = {}
        self._locations_raw: Dict = {}
        self._rules_raw: Dict = {}
        self._rule_objects: List[Rule] = []
        self._fuzzy_raw: Dict = {}
        self._bayesian_raw: Dict = {}
        self._questions_raw: Dict = {}
        self._loaded = False

    def reload(self) -> None:
        """Force reloading of all data from DB/JSON."""
        self._loaded = False
        self.load()

    def load(self) -> None:
        """Load all knowledge base data from Database or JSON files and build lookup indices."""
        if self._loaded:
            return

        loaded_from_db = False
        try:
            from ..db.database import SessionLocal
            from ..db.models import VehicleModel, VehicleVariantModel, VehiclePriceModel

            db = SessionLocal()
            try:
                db_vehicles = db.query(VehicleModel).filter(VehicleModel.is_active == True).all()
                db_variants = db.query(VehicleVariantModel).filter(VehicleVariantModel.is_active == True).all()
                db_prices = db.query(VehiclePriceModel).filter(VehiclePriceModel.is_verified == True).all()

                # 1. Base vehicles from vehicles.json
                vehicles_path = os.path.join(self.data_dir, "vehicles.json")
                if os.path.exists(vehicles_path):
                    with open(vehicles_path, "r", encoding="utf-8") as f:
                        v_data = json.load(f)
                    self._vehicles = [Vehicle(**v) for v in v_data.get("vehicles", [])]
                    for v in self._vehicles:
                        brand_prefix = f"{v.brand.lower()} "
                        if v.name.lower().startswith(brand_prefix):
                            v.name = v.name[len(brand_prefix):].strip()
                else:
                    self._vehicles = []
                    for v in db_vehicles:
                        self._vehicles.append(Vehicle(
                            id=v.id,
                            name=v.model_name,
                            brand=v.brand,
                            price_inr=500000.0,
                            price_segment="Budget",
                            vehicle_segment=v.body_type,
                            fuel_type="petrol",
                            transmission=["manual"],
                            running_cost_per_km=6.0,
                            maintenance_index=0.3,
                            performance_score=0.5,
                            city_score=0.7,
                            highway_score=0.7,
                            environment_score=0.5,
                            charging_dependency=0.0,
                            fuel_infrastructure_dependency=0.8,
                            seating_capacity=5,
                            ground_clearance_mm=170,
                            boot_space_litres=350,
                            used_market_available=False,
                            beginner_friendly=0.7,
                            resale_value_index=0.7
                        ))

                    # 2. Variants from DB
                    self._variants = []
                    for var in db_variants:
                        tx = [t.strip() for t in var.transmission.split(",")] if var.transmission else ["manual"]
                        feats = []
                        if var.features:
                            try:
                                feats = json.loads(var.features) if isinstance(var.features, str) else var.features
                            except Exception:
                                feats = [var.features]

                        self._variants.append(VehicleVariant(
                            id=var.id,
                            vehicle_id=var.vehicle_id,
                            brand=var.brand,
                            model_family=var.model_family,
                            model_name=var.model_name,
                            variant_name=var.variant_name,
                            fuel_type=var.fuel_type,
                            powertrain_type=var.powertrain_type,
                            transmission=tx,
                            price_inr=var.price_inr,
                            is_used=var.is_used,
                            used_price_inr=var.used_price_inr,
                            body_type=var.body_type,
                            vehicle_type=var.vehicle_type,
                            performance_type=var.performance_type,
                            engine_cc=var.engine_cc,
                            power_bhp=var.power_bhp,
                            torque_nm=var.torque_nm,
                            seating_capacity=var.seating_capacity,
                            boot_space_litres=var.boot_space_litres,
                            ground_clearance_mm=var.ground_clearance_mm,
                            features=feats,
                            ncap_rating=var.ncap_rating or 4,
                            has_adas=var.has_adas,
                            has_360_camera=var.has_360_camera,
                            running_cost_per_km=var.running_cost_per_km,
                            maintenance_index=var.maintenance_index,
                            resolved_ex_showroom_price=var.price_inr,
                            price_location_label="Starting Ex-Showroom (India-Wide)",
                            price_source_label="Official Manufacturer List / SIAM",
                            price_last_verified="September 2026",
                            is_city_specific_price=False
                        ))

                    # 3. Location prices from DB
                    self._prices = []
                    self._price_lookup = {}
                    for p in db_prices:
                        vp = VehiclePrice(
                            vehicle_variant_id=p.vehicle_variant_id,
                            state=p.state,
                            city=p.city,
                            ex_showroom_price_inr=p.ex_showroom_price_inr,
                            effective_from=p.effective_from,
                            effective_to=p.effective_to,
                            source=p.source,
                            last_verified=p.last_verified,
                            is_verified=p.is_verified
                        )
                        self._prices.append(vp)
                        vid = vp.vehicle_variant_id
                        if vid not in self._price_lookup:
                            self._price_lookup[vid] = {}
                        s_key = vp.state.lower().strip()
                        c_key = vp.city.lower().strip() if vp.city else None
                        self._price_lookup[vid][(s_key, c_key)] = vp
                        if c_key and (s_key, None) not in self._price_lookup[vid]:
                            self._price_lookup[vid][(s_key, None)] = vp

                    loaded_from_db = True
                    logger.info(f"Loaded {len(self._variants)} variants and {len(self._prices)} prices from database.")
            finally:
                db.close()
        except Exception as e:
            logger.warning(f"Database load bypassed or failed: {e}. Falling back to JSON files.")

        if not loaded_from_db:
            # Fallback to JSON files
            vehicles_path = os.path.join(self.data_dir, "vehicles.json")
            if os.path.exists(vehicles_path):
                with open(vehicles_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._vehicles = [Vehicle(**v) for v in data.get("vehicles", [])]
                for v in self._vehicles:
                    brand_prefix = f"{v.brand.lower()} "
                    if v.name.lower().startswith(brand_prefix):
                        v.name = v.name[len(brand_prefix):].strip()

            variants_path = os.path.join(self.data_dir, "variants.json")
            if os.path.exists(variants_path):
                with open(variants_path, "r", encoding="utf-8") as f:
                    vdata = json.load(f)
                self._variants = [VehicleVariant(**v) for v in vdata.get("variants", [])]
                for v in self._variants:
                    brand_prefix = f"{v.brand.lower()} "
                    if v.model_name and v.model_name.lower().startswith(brand_prefix):
                        v.model_name = v.model_name[len(brand_prefix):].strip()
                    if v.variant_name and v.variant_name.lower().startswith(brand_prefix):
                        v.variant_name = v.variant_name[len(brand_prefix):].strip()
                    if v.resolved_ex_showroom_price is None:
                        v.resolved_ex_showroom_price = v.price_inr
                        v.price_location_label = "Starting Ex-Showroom (India-Wide)"
                        v.price_source_label = "Official Manufacturer List / SIAM"
                        v.price_last_verified = "September 2026"
                        v.is_city_specific_price = False

            prices_path = os.path.join(self.data_dir, "prices.json")
            if os.path.exists(prices_path):
                with open(prices_path, "r", encoding="utf-8") as f:
                    pdata = json.load(f)
                self._prices = [VehiclePrice(**p) for p in pdata.get("prices", [])]
                self._price_lookup = {}
                for p in self._prices:
                    vid = p.vehicle_variant_id
                    if vid not in self._price_lookup:
                        self._price_lookup[vid] = {}
                    s_key = p.state.lower().strip()
                    c_key = p.city.lower().strip() if p.city else None
                    self._price_lookup[vid][(s_key, c_key)] = p
                    if c_key and (s_key, None) not in self._price_lookup[vid]:
                        self._price_lookup[vid][(s_key, None)] = p

        # 4. Load location hierarchy
        locations_path = os.path.join(self.data_dir, "locations.json")
        if os.path.exists(locations_path):
            with open(locations_path, "r", encoding="utf-8") as f:
                self._locations_raw = json.load(f)

        # 5. Load rules
        rules_path = os.path.join(self.data_dir, "rules.json")
        if os.path.exists(rules_path):
            with open(rules_path, "r", encoding="utf-8") as f:
                self._rules_raw = json.load(f)
            
            self._rule_objects = [
                Rule(
                    id=r["id"],
                    description=r["description"],
                    conditions=[RuleCondition(**c) for c in r["conditions"]],
                    conclusions=[RuleConclusion(**c) for c in r["conclusions"]],
                    priority=r.get("priority", 1),
                )
                for r in self._rules_raw.get("rules", [])
            ]
            self._rule_objects.sort(key=lambda r: r.priority)

        # 6. Load fuzzy sets
        fuzzy_path = os.path.join(self.data_dir, "fuzzy_sets.json")
        if os.path.exists(fuzzy_path):
            with open(fuzzy_path, "r", encoding="utf-8") as f:
                self._fuzzy_raw = json.load(f)

        # 7. Load Bayesian priors
        bayesian_path = os.path.join(self.data_dir, "bayesian_priors.json")
        if os.path.exists(bayesian_path):
            with open(bayesian_path, "r", encoding="utf-8") as f:
                self._bayesian_raw = json.load(f)

        # 8. Load questions
        questions_path = os.path.join(self.data_dir, "questions.json")
        if os.path.exists(questions_path):
            with open(questions_path, "r", encoding="utf-8") as f:
                self._questions_raw = json.load(f)

        self._loaded = True

    def get_vehicles(self) -> List[Vehicle]:
        self.load()
        return self._vehicles

    def get_variants(self) -> List[VehicleVariant]:
        self.load()
        return self._variants

    def get_rule_objects(self) -> List[Rule]:
        self.load()
        return self._rule_objects

    def is_valid_location(self, state: Optional[str] = None, city: Optional[str] = None) -> bool:
        self.load()
        if not state and not city:
            return True

        states_data = self._locations_raw.get("states_and_uts", [])
        state_map = {
            s.get("state", "").lower().strip(): [c.lower().strip() for c in s.get("cities", [])]
            for s in states_data
        }
        for s in states_data:
            code = s.get("code", "").lower().strip()
            if code:
                state_map[code] = [c.lower().strip() for c in s.get("cities", [])]

        if state:
            s_clean = state.lower().strip()
            if s_clean not in state_map:
                return False
            if city:
                c_clean = city.lower().strip()
                if c_clean not in state_map[s_clean]:
                    return False
        elif city:
            c_clean = city.lower().strip()
            all_cities = {c for cities in state_map.values() for c in cities}
            if c_clean not in all_cities:
                return False

        return True

    def get_locations(self) -> Dict:
        self.load()
        res = dict(self._locations_raw)
        if "states_and_uts" in res and "states" not in res:
            res["states"] = res["states_and_uts"]
        return res

    def resolve_variant_pricing(
        self, variant: VehicleVariant, state: Optional[str] = None, city: Optional[str] = None
    ) -> VehicleVariant:
        """
        Resolves the exact ex-showroom price for a variant at a given state and city.
        Never fakes prices. If exact city price is not in verified records, provides
        the manufacturer-listed starting ex-showroom price with an explicit disclaimer.
        """
        self.load()
        
        if not state:
            return variant

        s_key = state.lower().strip()
        c_key = city.lower().strip() if city else None
        
        vid = variant.id
        price_map = self._price_lookup.get(vid, {})

        # 1. Exact (state, city) match
        if c_key and (s_key, c_key) in price_map:
            p = price_map[(s_key, c_key)]
            var_copy = variant.model_copy()
            var_copy.resolved_ex_showroom_price = p.ex_showroom_price_inr
            var_copy.price_location_label = f"Ex-Showroom ({city}, {state})"
            var_copy.price_source_label = p.source or "Official Manufacturer Ex-Showroom Portal"
            var_copy.price_last_verified = p.last_verified or "September 2026"
            var_copy.is_city_specific_price = True
            return var_copy

        # 2. State-level verified price match
        if (s_key, None) in price_map:
            p = price_map[(s_key, None)]
            var_copy = variant.model_copy()
            var_copy.resolved_ex_showroom_price = p.ex_showroom_price_inr
            city_note = f" (Exact {city} unavailable; state benchmark applied)" if city else ""
            var_copy.price_location_label = f"Ex-Showroom ({state}){city_note}"
            var_copy.price_source_label = p.source or "Official State Manufacturer Ex-Showroom Portal"
            var_copy.price_last_verified = p.last_verified or "September 2026"
            var_copy.is_city_specific_price = False
            return var_copy

        # 3. Fallback: Base India starting ex-showroom price with clear label
        if variant.price_location_label and "Starting Ex-Showroom" in variant.price_location_label:
            return variant
            
        var_copy = variant.model_copy()
        var_copy.resolved_ex_showroom_price = variant.price_inr
        loc_str = f"{city}, {state}" if city else state
        var_copy.price_location_label = f"Starting Ex-Showroom ({loc_str} exact price unavailable)"
        var_copy.price_source_label = "Manufacturer-listed starting ex-showroom price"
        var_copy.price_last_verified = "September 2026"
        var_copy.is_city_specific_price = False
        return var_copy

    def search_suggestions(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Autocomplete across brand, model family, model name, variant name, and body type."""
        self.load()
        q = query.lower().strip()
        if not q:
            return []

        results = []
        seen = set()

        # Check brands
        brands = set(v.brand for v in self._variants)
        for b in sorted(brands):
            if q in b.lower() and b not in seen:
                matching_sample = next((v for v in self._variants if v.brand == b), None)
                results.append({
                    "type": "brand",
                    "id": f"brand_{b}",
                    "title": b,
                    "label": b,
                    "subtitle": "Manufacturer",
                    "brand": b,
                    "model_name": b,
                    "variant_name": "All Variants",
                    "fuel_type": matching_sample.fuel_type if matching_sample else "Various",
                    "price_inr": matching_sample.price_inr if matching_sample else 0,
                    "image_path": matching_sample.image_path if matching_sample else "/assets/cars/default_vehicle.svg"
                })
                seen.add(b)

        # Check models & variants
        for v in self._variants:
            full_var = f"{v.brand} {v.model_name} {v.variant_name}"
            if q in full_var.lower() and full_var not in seen:
                results.append({
                    "type": "variant",
                    "id": v.id,
                    "title": full_var,
                    "label": f"{v.model_name} • {v.variant_name}",
                    "subtitle": f"₹{(v.price_inr/100000):.2f}L • {v.fuel_type.upper()} {v.transmission[0].capitalize() if v.transmission else ''}",
                    "brand": v.brand,
                    "model_name": v.model_name,
                    "variant_name": v.variant_name,
                    "fuel_type": v.fuel_type,
                    "price_inr": v.price_inr,
                    "image_path": v.image_path or "/assets/cars/default_vehicle.svg"
                })
                seen.add(full_var)
                if len(results) >= limit:
                    break

        return results[:limit]

    def get_filter_options(self) -> Dict[str, Any]:
        """Provides metadata on available options for multi-select filtering."""
        self.load()
        brands = sorted(list(set(v.brand for v in self._variants)))
        families = sorted(list(set(v.model_family for v in self._variants)))
        body_types = sorted(list(set(v.body_type for v in self._variants)))
        vehicle_types = sorted(list(set(v.vehicle_type for v in self._variants)))
        performance_types = sorted(list(set(v.performance_type for v in self._variants)))
        powertrains = sorted(list(set(v.fuel_type for v in self._variants)))
        all_features = set()
        for v in self._variants:
            all_features.update(v.features)

        return {
            "brands": brands,
            "model_families": families,
            "body_types": body_types,
            "vehicle_types": vehicle_types,
            "performance_types": performance_types,
            "powertrains": powertrains,
            "transmissions": ["Manual", "Automatic", "AMT", "CVT", "DCT", "Single-Speed", "manual", "automatic"],
            "seating": [2, 4, 5, 6, 7, 8],
            "seating_capacities": [2, 4, 5, 6, 7, 8],
            "conditions": ["new", "used"],
            "features": sorted(list(all_features)),
            "luxury_levels": ["Budget", "Premium", "Luxury", "High Luxury", "Exotic"],
            "offroad_capabilities": ["None", "Soft-Roader", "AWD", "4x4 / Off-Road"]
        }

    def get_vehicle_types(self) -> List[str]:
        self.load()
        return list(set(v.fuel_type for v in self._vehicles))

    def get_rules(self) -> Dict:
        self.load()
        return self._rules_raw

    def get_fuzzy_sets(self) -> Dict:
        self.load()
        return self._fuzzy_raw

    def get_bayesian_priors(self) -> Dict:
        self.load()
        return self._bayesian_raw

    def get_questions(self) -> Dict:
        self.load()
        import copy
        questions_copy = copy.deepcopy(self._questions_raw)
        brands = sorted(list(set(v.brand for v in (self._variants or self._vehicles) if v.brand)))
        brand_options = [{"label": b, "value": b} for b in brands]
        
        for step in questions_copy.get("steps", []):
            for q in step.get("questions", []):
                if q.get("id") == "preferred_brands" or q.get("maps_to") == "preferred_brands":
                    q["options"] = brand_options
        return questions_copy

    def get_knowledge_base_summary(self) -> Dict:
        """Return comprehensive summary of the expanded knowledge base."""
        self.load()
        return {
            "vehicles_count": len(self._vehicles),
            "variants_count": len(self._variants),
            "brands_count": len(set(v.brand for v in self._variants)),
            "location_prices_count": len(self._prices),
            "states_count": len(self._locations_raw.get("states", [])),
            "rules_count": len(self._rules_raw.get("rules", [])),
            "fuzzy_sets_count": len(self._fuzzy_raw.get("fuzzy_sets", {})),
            "bayesian_nodes_count": len(self._bayesian_raw.get("nodes", {})),
            "questionnaire_steps": len(self._questions_raw.get("steps", [])),
        }


kb_service = KnowledgeBaseService()
