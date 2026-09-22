"""
API Routes

REST API endpoints for the vehicle decision support and recommendation system.
Supports:
- Standard questionnaire recommendation pipeline
- Advanced multi-filter search and AI ranking (/api/recommend/advanced)
- First-class vehicle variants (/api/variants)
- Pan-India location master (/api/locations)
- Autocomplete search suggestions (/api/search)
- Multi-vehicle comparison matrix (/api/compare)
- On-road price breakdown estimator (/api/price-estimate)
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.user_profile import UserProfile, AdvancedFilterQuery
from app.services.recommendation import recommendation_service
from app.services.knowledge_base import kb_service
from app.services.vehicle_image_service import vehicle_image_service
from app.models.vehicle_image import VehicleImageResponse

router = APIRouter(prefix="/api")


class CompareRequest(BaseModel):
    variant_ids: List[str]
    state: Optional[str] = None
    city: Optional[str] = None


@router.post("/recommend")
async def recommend(profile: UserProfile):
    """
    Run the full AI recommendation pipeline for the everyday questionnaire.
    """
    try:
        result = recommendation_service.recommend(profile)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommend/advanced")
async def recommend_advanced(query: AdvancedFilterQuery):
    """
    Advanced multi-filter & vehicle search with AI suitability scoring:
    - Multi-select OR within categories, AND between categories
    - Strict location-specific ex-showroom price filtering
    - Transparent 'why excluded' explanations
    """
    try:
        return recommendation_service.recommend_advanced(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vehicles")
async def get_vehicles():
    """Return base vehicles from the knowledge base with resolved real images."""
    vehicles = kb_service.get_vehicles()
    out = []
    for v in vehicles:
        d = v.model_dump()
        img = vehicle_image_service.resolve_vehicle_image(
            vehicle_id=v.id,
            brand=v.brand,
            model_name=v.name,
            body_type=v.vehicle_segment,
            existing_image_path=v.image_path,
        )
        d["image_url"] = img.image_url
        d["image_path"] = img.image_url
        d["image_source"] = img.source
        d["image_attribution"] = img.attribution
        d["image_license"] = img.license
        d["is_fallback"] = img.is_fallback
        out.append(d)
    return out


@router.get("/vehicles/{vehicle_id}/image", response_model=VehicleImageResponse)
async def get_vehicle_image(
    vehicle_id: str,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    variant: Optional[str] = None,
    body_type: Optional[str] = None
):
    """
    Returns high-quality, verified image for a vehicle or variant.
    Cascades through:
    1. Persistent cache
    2. Curated local image (/assets/cars/...)
    3. Live CarAPI lookup (make + model)
    4. CarAPI alias lookup
    5. Sleek Slate body-type SVG vector fallback
    6. Sleek Slate generic automotive SVG fallback
    """
    all_vars = {v.id: v for v in kb_service.get_variants()}
    all_vehs = {v.id: v for v in kb_service.get_vehicles()}

    existing_path = None
    if vehicle_id in all_vars:
        kb_v = all_vars[vehicle_id]
        brand = brand or kb_v.brand
        model = model or kb_v.model_name
        variant = variant or kb_v.variant_name
        body_type = body_type or kb_v.body_type
        existing_path = kb_v.image_path
    elif vehicle_id in all_vehs:
        kb_v = all_vehs[vehicle_id]
        brand = brand or kb_v.brand
        model = model or kb_v.name
        body_type = body_type or kb_v.vehicle_segment
        existing_path = kb_v.image_path

    img_res = vehicle_image_service.resolve_vehicle_image(
        vehicle_id=vehicle_id,
        brand=brand,
        model_name=model,
        variant_name=variant,
        body_type=body_type,
        existing_image_path=existing_path
    )
    return img_res


@router.post("/admin/vehicles/resolve-images")
async def resolve_all_vehicle_images():
    """
    Admin pre-warming endpoint to batch resolve images for all vehicles and variants
    and persist results to data/vehicle_images.json.
    """
    variants = kb_service.get_variants()
    vehicles = kb_service.get_vehicles()
    all_items = list(variants) + list(vehicles)
    count = vehicle_image_service.resolve_catalogue_bulk(all_items)
    return {
        "status": "success",
        "total_resolved": count,
        "cache_file": "data/vehicle_images.json"
    }


@router.get("/variants")
async def get_variants(state: Optional[str] = None, city: Optional[str] = None):
    """Return all first-class vehicle variants with location pricing and verified real images resolved."""
    if (state or city) and not kb_service.is_valid_location(state, city):
        raise HTTPException(status_code=400, detail="Invalid state or city specified")
    variants = kb_service.get_variants()
    resolved = [kb_service.resolve_variant_pricing(v, state, city) for v in variants]
    out = []
    for v in resolved:
        d = v.model_dump()
        img = vehicle_image_service.resolve_vehicle_image(
            vehicle_id=v.id,
            brand=v.brand,
            model_name=v.model_name,
            variant_name=v.variant_name,
            body_type=v.body_type,
            existing_image_path=v.image_path,
        )
        d["image_url"] = img.image_url
        d["image_path"] = img.image_url
        d["image_source"] = img.source
        d["image_attribution"] = img.attribution
        d["image_license"] = img.license
        d["is_fallback"] = img.is_fallback
        out.append(d)
    return out


@router.get("/locations")
async def get_locations():
    """Return authoritative Pan-India state and city master dataset."""
    return kb_service.get_locations()


@router.get("/filter-options")
async def get_filter_options():
    """Return filter options for brands, model families, body types, etc."""
    return kb_service.get_filter_options()


@router.get("/search")
async def search_suggestions(q: str = Query(..., min_length=1)):
    """Search autocomplete across brand, model family, model, variant, and category."""
    return kb_service.search_suggestions(q)


@router.post("/compare")
async def compare_vehicles(req: CompareRequest):
    """
    Side-by-side comparison matrix for 2-4 selected variants:
    Compares ex-showroom price at selected location, powertrain, transmission,
    performance specs, dimensions, safety, running costs, and AI benchmark scores.
    """
    all_vars = {v.id: v for v in kb_service.get_variants()}
    selected = []
    for vid in req.variant_ids[:4]:
        if vid in all_vars:
            v_resolved = kb_service.resolve_variant_pricing(all_vars[vid], req.state, req.city)
            d = v_resolved.model_dump()
            img = vehicle_image_service.resolve_vehicle_image(
                vehicle_id=v_resolved.id,
                brand=v_resolved.brand,
                model_name=v_resolved.model_name,
                variant_name=v_resolved.variant_name,
                body_type=v_resolved.body_type,
                existing_image_path=v_resolved.image_path,
            )
            d["image_url"] = img.image_url
            d["image_path"] = img.image_url
            d["image_source"] = img.source
            d["image_attribution"] = img.attribution
            d["image_license"] = img.license
            d["is_fallback"] = img.is_fallback
            selected.append(d)

    if not selected:
        raise HTTPException(status_code=404, detail="None of the requested variants were found.")

    return {
        "compared_count": len(selected),
        "location": {"state": req.state or "All India", "city": req.city or "Starting Ex-Showroom"},
        "variants": selected
    }


@router.get("/price-estimate")
async def get_price_estimate(
    ex_showroom: float = Query(..., gt=0),
    fuel_type: str = "petrol",
    state: str = "Delhi",
    is_ev: bool = False
):
    """
    Optional Estimated On-Road Price Calculator:
    Clearly distinguishes official ex-showroom price from estimated road tax, registration, and insurance.
    """
    # Road tax estimation based on state and fuel type (indicative academic benchmark)
    st_low = state.lower()
    if is_ev or fuel_type.lower() == "ev":
        road_tax_pct = 0.0  # Many Indian states have 0% road tax for EVs
        registration_fees = 1500.0
    elif "delhi" in st_low:
        road_tax_pct = 0.08 if ex_showroom < 1000000 else 0.10
        registration_fees = 1500.0
    elif "tamil nadu" in st_low:
        road_tax_pct = 0.10 if ex_showroom < 1000000 else 0.15
        registration_fees = 2000.0
    elif "andhra pradesh" in st_low:
        road_tax_pct = 0.12 if ex_showroom < 1000000 else 0.14
        registration_fees = 2000.0
    else:
        road_tax_pct = 0.10
        registration_fees = 1800.0

    road_tax = round(ex_showroom * road_tax_pct)
    insurance = round(ex_showroom * 0.038 + 5000.0)  # ~3.8% comprehensive 1+3 yr
    fastag_and_cess = 1500.0

    estimated_on_road = round(ex_showroom + road_tax + insurance + registration_fees + fastag_and_cess)

    return {
        "ex_showroom_price_inr": ex_showroom,
        "state": state,
        "breakdown": {
            "road_tax_and_registration": road_tax + registration_fees,
            "comprehensive_insurance_est": insurance,
            "fastag_and_statutory_fees": fastag_and_cess,
        },
        "rto_road_tax": road_tax,
        "insurance_estimated": insurance,
        "estimated_on_road_price_inr": estimated_on_road,
        "on_road_estimated": estimated_on_road,
        "disclaimer": "This is an academic benchmark estimate. Road tax and insurance vary by RTO and insurer."
    }


@router.get("/rules")
async def get_rules():
    return kb_service.get_rules()


@router.get("/fuzzy-sets")
async def get_fuzzy_sets():
    return kb_service.get_fuzzy_sets()


@router.get("/bayesian-priors")
async def get_bayesian_priors():
    return kb_service.get_bayesian_priors()


@router.get("/questions")
async def get_questions():
    return kb_service.get_questions()


@router.get("/knowledge-base")
async def get_knowledge_base():
    return kb_service.get_knowledge_base_summary()


@router.post("/infer")
async def run_inference(profile: UserProfile):
    try:
        from app.engines.forward_chaining import ForwardChainingEngine

        engine = ForwardChainingEngine(rules=kb_service.get_rule_objects())

        facts = {
            "daily_distance": profile.daily_distance,
            "driving_environment": profile.driving_environment.value if hasattr(profile.driving_environment, "value") else str(profile.driving_environment),
            "experience": profile.experience.value if hasattr(profile.experience, "value") else str(profile.experience),
            "driving_confidence": profile.driving_confidence.value if hasattr(profile.driving_confidence, "value") else str(profile.driving_confidence),
            "driving_frequency": profile.driving_frequency.value if hasattr(profile.driving_frequency, "value") else str(profile.driving_frequency),
            "transmission_preference": profile.transmission_preference.value if hasattr(profile.transmission_preference, "value") else str(profile.transmission_preference),
            "charging_knowledge": profile.charging_knowledge.value if hasattr(profile.charging_knowledge, "value") else str(profile.charging_knowledge),
            "parking": profile.parking.value if hasattr(profile.parking, "value") else str(profile.parking),
            "fuel_station_access": profile.fuel_station_access.value if hasattr(profile.fuel_station_access, "value") else str(profile.fuel_station_access),
            "first_time_owner": profile.first_time_owner,
            "long_distance_frequency": profile.long_distance_frequency.value if hasattr(profile.long_distance_frequency, "value") else str(profile.long_distance_frequency),
            "environmental_preference": profile.environmental_preference.value if hasattr(profile.environmental_preference, "value") else str(profile.environmental_preference),
            "seating_requirement": profile.seating_requirement,
            "boot_space_need": profile.boot_space_need.value if hasattr(profile.boot_space_need, "value") else str(profile.boot_space_need),
            "ground_clearance_need": profile.ground_clearance_need.value if hasattr(profile.ground_clearance_need, "value") else str(profile.ground_clearance_need),
            "running_cost_importance": profile.running_cost_importance.value if hasattr(profile.running_cost_importance, "value") else str(profile.running_cost_importance),
            "maintenance_importance": profile.maintenance_importance.value if hasattr(profile.maintenance_importance, "value") else str(profile.maintenance_importance),
            "performance_importance": profile.performance_importance.value if hasattr(profile.performance_importance, "value") else str(profile.performance_importance),
            "vehicle_condition_preference": profile.vehicle_condition_preference.value if hasattr(profile.vehicle_condition_preference, "value") else str(profile.vehicle_condition_preference),
            "priority_running_cost": profile.priority_running_cost,
            "priority_maintenance": profile.priority_maintenance,
            "priority_performance": profile.priority_performance,
            "priority_environment": profile.priority_environment,
            "priority_purchase_price": profile.priority_purchase_price,
            "priority_long_distance": profile.priority_long_distance,
            "priority_comfort": profile.priority_comfort,
        }

        budget = profile.purchase_budget
        if budget <= 600000:
            facts["budget_segment"] = "budget"
        elif budget <= 1200000:
            facts["budget_segment"] = "medium"
        elif budget <= 2000000:
            facts["budget_segment"] = "high"
        else:
            facts["budget_segment"] = "premium"

        engine.set_facts(facts)
        result = engine.infer()
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class NegotiationRequest(BaseModel):
    vehicle_id: Optional[str] = "generic_used"
    listed_price: float = Field(..., gt=0)
    year_of_manufacture: Optional[int] = 2021
    odometer_km: Optional[int] = 45000
    condition_grade: Optional[str] = "Good"  # "Excellent", "Good", "Fair", "Poor"
    ownership_count: Optional[int] = 1
    service_history: Optional[str] = "Complete OEM Records"  # "Complete OEM Records", "Partial", "None"
    accident_history: Optional[str] = "Clean / Zero Major"
    user_initial_offer: Optional[float] = None


@router.post("/negotiate")
async def evaluate_negotiation(req: NegotiationRequest):
    """
    AI-Powered Used Vehicle Fair Valuation & Negotiation Support Engine.
    Uses multi-attribute depreciation models, odometer wear penalties,
    ownership count risk offsets, and verifiable leverage points.
    """
    try:
        current_year = 2026
        year = req.year_of_manufacture or 2021
        age_years = max(1, current_year - year)
        listed = float(req.listed_price)
        odo = req.odometer_km or 45000

        # Attempt to retrieve original vehicle ex-showroom anchor
        all_vehicles = {v.id: v for v in kb_service.get_vehicles()}
        matched_veh = all_vehicles.get(req.vehicle_id)
        if matched_veh:
            original_anchor = float(matched_veh.price_inr)
        else:
            # Baseline anchor approximation if not directly mapped
            deprec_multiplier = 1.0 + (0.12 * age_years)
            original_anchor = listed * deprec_multiplier

        # 1. Base Age Depreciation Curve
        depreciation_table = {
            1: 0.16,
            2: 0.26,
            3: 0.36,
            4: 0.44,
            5: 0.52,
            6: 0.58,
            7: 0.64,
            8: 0.70
        }
        base_deprec = depreciation_table.get(age_years, min(0.82, 0.52 + (age_years - 5) * 0.05))

        # 2. Odometer Mileage Wear Adjustment
        expected_km = age_years * 12000
        odo_diff = odo - expected_km
        # +/- 0.5% per 5,000 km variance
        odo_factor = (odo_diff / 5000.0) * 0.005
        odo_factor = max(-0.15, min(0.20, odo_factor))

        # 3. Condition Grade Multiplier
        cond_map = {
            "Excellent": -0.04,  # Retains 4% more value
            "Good": 0.00,
            "Fair": 0.08,        # Loses 8% value
            "Poor": 0.20         # Loses 20% value
        }
        cond_factor = cond_map.get(req.condition_grade, 0.00)

        # 4. Ownership History Multiplier
        owners = req.ownership_count or 1
        owner_factor = 0.00 if owners <= 1 else (0.07 if owners == 2 else 0.16)

        # 5. Service Record Multiplier
        service_map = {
            "Complete OEM Records": -0.02,
            "Partial": 0.04,
            "None": 0.09
        }
        service_factor = service_map.get(req.service_history, 0.00)

        # 6. Accident History
        accident_map = {
            "Clean / Zero Major": 0.00,
            "Minor Repainted Panels": 0.06,
            "Structural / Major": 0.28
        }
        accident_factor = accident_map.get(req.accident_history, 0.00)

        total_deprec_rate = min(0.88, max(0.10, base_deprec + odo_factor + cond_factor + owner_factor + service_factor + accident_factor))

        calculated_fair_mid = original_anchor * (1.0 - total_deprec_rate)
        # Ensure fair value is reasonably bounded around listed price if original anchor was synthetic
        if abs(calculated_fair_mid - listed) / max(listed, 1) > 0.45:
            calculated_fair_mid = (calculated_fair_mid + listed * 0.90) / 2.0

        fair_low = round(calculated_fair_mid * 0.93, -2)
        fair_mid = round(calculated_fair_mid, -2)
        fair_high = round(calculated_fair_mid * 1.05, -2)

        recommended_starting_offer = round(fair_mid * 0.91, -2)
        walk_away_ceiling = round(fair_high, -2)

        price_gap_pct = round(((listed - fair_mid) / max(fair_mid, 1)) * 100, 1)

        if price_gap_pct > 8.0:
            verdict = f"Priced above fair market comps by ~{price_gap_pct}% (High Negotiation Leverage)"
            verdict_badge = "OVERPRICED"
        elif price_gap_pct < -8.0:
            verdict = f"Priced ~{abs(price_gap_pct)}% below market expectation (Inspect mechanical history)"
            verdict_badge = "BELOW_MARKET"
        else:
            verdict = f"Fairly positioned within the standard ~{abs(price_gap_pct)}% dealer spread"
            verdict_badge = "FAIR_MARKET"

        # Evidence-Based Leverage Points
        leverage_points = []
        if odo >= 40000:
            leverage_points.append(
                f"Odometer reading of {odo:,} km enters the scheduled wear interval for tire sets and front suspension linkages (~₹25,000–₹40,000 pending outlay)."
            )
        if owners >= 2:
            leverage_points.append(
                f"{owners} previous owners on RC Book creates a documented ~7% resale retention deduction on secondary liquidation."
            )
        if req.service_history in ["Partial", "None"]:
            leverage_points.append(
                "Lack of continuous authorized OEM service records increases unknown transmission and timing component risk."
            )
        if age_years >= 4:
            leverage_points.append(
                f"At {age_years} years of operational age, factory battery and brake rotors warrant immediate mechanical inspection allowance."
            )
        if not leverage_points:
            leverage_points.append(
                "Clean operational telemetry with documented pedigree; standard cash closing discount of 3%–5% is appropriate."
            )

        # Offer assessment if user provided one
        user_offer_eval = None
        if req.user_initial_offer is not None and req.user_initial_offer > 0:
            u_offer = float(req.user_initial_offer)
            if u_offer < fair_low * 0.85:
                user_offer_eval = "Aggressive lowball (< 80% fair market value). Seller is likely to reject without counter."
            elif u_offer < fair_low:
                user_offer_eval = "Strong buyer-oriented starting bid. Provides ample room to settle near fair market midpoint."
            elif u_offer <= fair_high:
                user_offer_eval = "Realistic offer directly within the seller's expected closing bracket."
            else:
                user_offer_eval = "Offer exceeds fair market value ceiling. We recommend reducing your opening bid."

        return {
            "vehicle_id": req.vehicle_id,
            "listed_price": listed,
            "fair_market_value": {
                "low": fair_low,
                "mid": fair_mid,
                "high": fair_high
            },
            "recommended_starting_bid": recommended_starting_offer,
            "walk_away_ceiling": walk_away_ceiling,
            "estimated_savings_potential": max(0, round(listed - fair_mid, -2)),
            "verdict": verdict,
            "verdict_badge": verdict_badge,
            "price_delta_percent": price_gap_pct,
            "leverage_points": leverage_points,
            "user_offer_assessment": user_offer_eval,
            "depreciation_summary": {
                "age_years": age_years,
                "computed_total_depreciation_percent": round(total_deprec_rate * 100, 1),
                "model": "Multi-Attribute Continuous Depreciation & Wear Engine"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
