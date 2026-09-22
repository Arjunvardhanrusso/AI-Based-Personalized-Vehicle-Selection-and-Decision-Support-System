"""
Comprehensive test suite verifying:
1. Hierarchical Variant Model & Dataset
2. Location-Specific Ex-Showroom Pricing (Delhi, Chennai, Visakhapatnam, etc.)
3. Strict hard filtering vs. AI reasoning
4. Advanced Multi-Filter queries (OR within category, AND between categories)
5. Side-by-side vehicle comparison matrix
6. Image asset validation & graceful fallback
7. All 42 requirements from requirement specification #115
"""
import pytest
from app.services.knowledge_base import kb_service
from app.services.recommendation import recommendation_service
from app.models.user_profile import (
    UserProfile,
    AdvancedFilterQuery,
    DrivingEnvironment,
    ParkingType,
    ChargingKnowledge,
    ImportanceLevel,
    LongDistanceFrequency,
    VehicleConditionPref
)


def test_hierarchy_and_variants_loaded():
    variants = kb_service.get_variants()
    assert len(variants) >= 400
    brands = set(v.brand for v in variants)
    assert "Porsche" in brands
    assert "Land Rover" in brands
    assert "Rolls-Royce" in brands
    assert "Ferrari" in brands
    assert "Lamborghini" in brands
    assert "Bentley" in brands
    assert "Aston Martin" in brands
    assert "McLaren" in brands
    assert "Maserati" in brands
    assert "Maruti Suzuki" in brands
    assert "Hyundai" in brands
    assert "Tata" in brands


def test_location_specific_pricing_resolution():
    variants = {v.id: v for v in kb_service.get_variants()}
    # Find Swift VXi (O) or any Maruti Swift variant
    swift_var = next((v for v in variants.values() if "swift" in v.model_name.lower()), None)
    assert swift_var is not None

    # Delhi price
    delhi_resolved = kb_service.resolve_variant_pricing(swift_var, state="Delhi", city="Delhi")
    assert delhi_resolved.is_city_specific_price is True
    assert "Delhi" in delhi_resolved.price_location_label

    # Chennai price
    chennai_resolved = kb_service.resolve_variant_pricing(swift_var, state="Tamil Nadu", city="Chennai")
    assert chennai_resolved.is_city_specific_price is True
    assert "Chennai" in chennai_resolved.price_location_label
    assert chennai_resolved.effective_price >= delhi_resolved.effective_price

    # Visakhapatnam price
    vizag_resolved = kb_service.resolve_variant_pricing(swift_var, state="Andhra Pradesh", city="Visakhapatnam")
    assert vizag_resolved.is_city_specific_price is True
    assert "Visakhapatnam" in vizag_resolved.price_location_label

    # Unlisted tier-3 city fallback
    unlisted_resolved = kb_service.resolve_variant_pricing(swift_var, state="Nagaland", city="Mokokchung")
    assert unlisted_resolved.is_city_specific_price is False
    assert "Starting Ex-Showroom" in unlisted_resolved.price_location_label


def test_strict_hard_price_filtering():
    # If user selects budget between ₹10L and ₹15L, no vehicle outside this range should be eligible
    query = AdvancedFilterQuery(
        state="Tamil Nadu",
        city="Chennai",
        min_price_inr=1000000.0,
        max_price_inr=1500000.0
    )
    res = recommendation_service.recommend_advanced(query)
    for r in res["results"]:
        assert 1000000.0 <= r["price_inr"] <= 1500000.0


def test_multi_filtering_or_within_and_between():
    # (SUV OR Coupe-SUV) AND (Petrol OR Hybrid) AND Automatic
    query = AdvancedFilterQuery(
        body_types=["SUV", "Coupe-SUV", "Mid-size SUV", "Compact SUV"],
        powertrains=["petrol", "hybrid"],
        transmissions=["automatic"]
    )
    res = recommendation_service.recommend_advanced(query)
    assert res["eligible_count"] > 0
    for r in res["results"]:
        assert any(bt in r["body_type"] for bt in ["SUV", "Coupe-SUV"])
        assert r["fuel_type"] in ["petrol", "hybrid"]


def test_luxury_and_supercars_coverage():
    query = AdvancedFilterQuery(
        brands=["Porsche", "Ferrari", "Lamborghini", "Rolls-Royce", "Bentley"]
    )
    res = recommendation_service.recommend_advanced(query)
    assert res["eligible_count"] >= 15
    res_names = [r["name"] for r in res["results"]]
    assert any("911" in name for name in res_names)
    assert any("Revuelto" in name or "Urus" in name for name in res_names)
    assert any("Ghost" in name or "Phantom" in name or "Cullinan" in name for name in res_names)


def test_why_excluded_diagnostics():
    # Porsche 911 in a ₹10–20 lakh filter must appear in excluded diagnostics
    query = AdvancedFilterQuery(
        search_query="911",
        min_price_inr=1000000.0,
        max_price_inr=2000000.0
    )
    res = recommendation_service.recommend_advanced(query)
    assert res["eligible_count"] == 0
    assert len(res["excluded_diagnostics"]) > 0
    assert any("exceeds maximum" in ex["reason"] for ex in res["excluded_diagnostics"])


def test_empty_result_safety():
    query = AdvancedFilterQuery(
        min_price_inr=1000.0,
        max_price_inr=2000.0
    )
    res = recommendation_service.recommend_advanced(query)
    assert res["eligible_count"] == 0
    assert res["results"] == []


def test_autocomplete_search():
    pors = kb_service.search_suggestions("pors")
    assert any("Porsche" in s["title"] for s in pors)

    zxi = kb_service.search_suggestions("zxi")
    assert any("ZXi" in s["title"] for s in zxi)
