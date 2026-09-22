"""
Comprehensive unit tests for AI reasoning engines and CNG support.
"""
import pytest
from app.models.user_profile import (
    UserProfile,
    ExperienceLevel,
    DrivingEnvironment,
    TransmissionPreference,
    ChargingKnowledge,
    ParkingType,
    ImportanceLevel,
    LongDistanceFrequency,
    BootSpaceNeed,
    GroundClearanceNeed,
    DrivingFrequency,
    ConfidenceLevel,
    FuelStationAccess,
    VehicleConditionPref,
)
from app.services.recommendation import recommendation_service
from app.services.knowledge_base import kb_service
from app.engines.forward_chaining import ForwardChainingEngine
from app.engines.fuzzy_engine import FuzzyEngine
from app.engines.bayesian_engine import BayesianEngine
import os

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(os.path.dirname(_BASE_DIR), "data")


def test_knowledge_base_loading():
    vehicles = kb_service.get_vehicles()
    assert len(vehicles) >= 29
    fuel_types = kb_service.get_vehicle_types()
    assert "cng" in fuel_types
    assert "ev" in fuel_types
    assert "hybrid" in fuel_types
    assert "petrol" in fuel_types
    assert "diesel" in fuel_types


def test_forward_chaining_cng_rules():
    fc = ForwardChainingEngine()
    fc.load_rules_from_file(os.path.join(_DATA_DIR, "rules.json"))
    fc.set_facts({
        "daily_distance": 50,
        "driving_environment": "city",
        "running_cost_importance": "very_high",
        "price_sensitivity": "high",
        "fuel_station_access": "easy"
    })
    result = fc.infer()
    assert result.derived_facts.get("cng_advantage") == "true" or result.derived_facts.get("cng_candidate") == "true"


def test_bayesian_cng_node():
    be = BayesianEngine()
    be.load_from_file(os.path.join(_DATA_DIR, "bayesian_priors.json"))
    result = be.reason({
        "daily_usage": "high",
        "driving_environment": "city",
        "fuel_station_access": "easy"
    })
    cng_nodes = [n for n in result.nodes if n.node_name == "cng_suitability"]
    assert len(cng_nodes) == 1
    assert cng_nodes[0].dominant_state == "high"


def test_profile_a_ev_enthusiast():
    profile = UserProfile(
        daily_distance=20.0,
        driving_environment=DrivingEnvironment.CITY,
        purchase_budget=1600000.0,
        parking=ParkingType.PRIVATE_HOUSE,
        charging_knowledge=ChargingKnowledge.AVAILABLE,
        environmental_preference=ImportanceLevel.VERY_HIGH,
        priority_environment=0.95,
        priority_running_cost=0.9,
    )
    res = recommendation_service.recommend(profile)
    assert res.category_scores[0].category == "ev"


def test_profile_b_diesel_highway_cruiser():
    profile = UserProfile(
        daily_distance=90.0,
        driving_environment=DrivingEnvironment.HIGHWAY,
        long_distance_frequency=LongDistanceFrequency.FREQUENT,
        purchase_budget=1800000.0,
        fuel_station_access=FuelStationAccess.EASY,
        priority_long_distance=0.95,
        priority_performance=0.8,
    )
    res = recommendation_service.recommend(profile)
    top_cat = res.category_scores[0].category
    assert top_cat in ("diesel", "hybrid")


def test_profile_c_cng_budget_commuter():
    profile = UserProfile(
        daily_distance=55.0,
        driving_environment=DrivingEnvironment.CITY,
        long_distance_frequency=LongDistanceFrequency.RARE,
        purchase_budget=750000.0,
        running_cost_importance=ImportanceLevel.VERY_HIGH,
        parking=ParkingType.STREET_PARKING,
        charging_knowledge=ChargingKnowledge.UNAVAILABLE,
        fuel_station_access=FuelStationAccess.EASY,
        priority_running_cost=0.95,
        priority_purchase_price=0.9,
    )
    res = recommendation_service.recommend(profile)
    cng_score = next(c for c in res.category_scores if c.category == "cng")
    assert cng_score.score > 60.0
    # CNG should rank top or second
    assert res.category_scores[0].category in ("cng", "petrol")


def test_profile_d_family_hybrid_suv():
    profile = UserProfile(
        seating_requirement=7,
        boot_space_need=BootSpaceNeed.LARGE,
        ground_clearance_need=GroundClearanceNeed.HIGH,
        purchase_budget=2400000.0,
        priority_comfort=0.9,
    )
    res = recommendation_service.recommend(profile)
    top_v = res.top_vehicles[0]
    assert top_v["score"] > 50.0


def test_used_car_preference_recommendation():
    profile = UserProfile(
        purchase_budget=450000.0,
        vehicle_condition_preference=VehicleConditionPref.PREFER_USED,
        priority_purchase_price=0.95,
        first_time_owner=True,
    )
    res = recommendation_service.recommend(profile)
    # Check that a pre-owned vehicle appears in top recommendations
    top_vehicle_names = [v["name"] for v in res.top_vehicles]
    assert any("Used" in name or "Pre-Owned" in name or v.get("is_used") for name, v in zip(top_vehicle_names, res.top_vehicles))

