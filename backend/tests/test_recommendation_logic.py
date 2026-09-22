import pytest
from app.models.user_profile import UserProfile, AdvancedFilterQuery
from app.services.recommendation import recommendation_service
from app.models.vehicle import VehicleVariant

def test_specific_model_selection_is_respected():
    """
    Test that if the user explicitly prefers a specific model (e.g., 'Hyundai Exter'),
    the recommendation engine respects that selection and doesn't fall back to unrelated cars.
    """
    profile = UserProfile(
        purchase_budget=700000,
        preferred_brands=["Hyundai Exter"]
    )
    response = recommendation_service.recommend(profile)
    
    # Check that at least one of the recommended top vehicles is the preferred model
    # (assuming it's available in the KB within the budget)
    found_exter = False
    for v in response.vehicle_rankings:
        if v.get("brand", "").lower() == "hyundai" and v.get("model_name", "").lower() == "exter":
            found_exter = True
            break
            
    assert found_exter, "Hyundai Exter should be in the recommendations if explicitly selected and within budget."


def test_recommendations_are_deduplicated():
    """
    Test that the recommendation engine deduplicates results by variant ID
    to avoid returning multiple identical variants (e.g., 'Maruti Suzuki Baleno ZXi').
    """
    profile = UserProfile(
        purchase_budget=1200000
    )
    response = recommendation_service.recommend(profile)
    
    seen_ids = set()
    for rank in response.vehicle_rankings:
        variant_id = rank.get("variant_id")
        assert variant_id not in seen_ids, f"Duplicate variant ID found: {variant_id}"
        seen_ids.add(variant_id)

def test_advanced_model_selection():
    """
    Test that the advanced filter query respects the 'models' constraint.
    """
    query = AdvancedFilterQuery(
        models=["Exter"]
    )
    response = recommendation_service.recommend_advanced(query)
    
    for rank in response.get("results", []):
        assert rank.get("model_name", "").lower() == "exter", f"Expected model Exter, got {rank.get('model_name')}"
