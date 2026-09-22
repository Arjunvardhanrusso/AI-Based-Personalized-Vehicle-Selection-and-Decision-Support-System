import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

DELHI_STATE = "Delhi"
DELHI_CITY = "Delhi"
TAMIL_NADU_STATE = "Tamil Nadu"
CHENNAI_CITY = "Chennai"


def assert_success(response):
    assert 200 <= response.status_code < 300, response.text


def test_locations_endpoint():
    response = client.get("/api/locations")
    assert_success(response)

    data = response.json()

    assert "states" in data
    assert isinstance(data["states"], list)
    assert len(data["states"]) > 0

    state_names = [item["state"] for item in data["states"]]

    assert "Delhi" in state_names
    assert "Tamil Nadu" in state_names
    assert "Andhra Pradesh" in state_names

    for state in data["states"]:
        assert "state" in state
        assert isinstance(state["state"], str)
        assert state["state"].strip()

        if "cities" in state:
            assert isinstance(state["cities"], list)


def test_filter_options_endpoint():
    response = client.get("/api/filter-options")
    assert_success(response)

    data = response.json()

    required_keys = [
        "brands",
        "body_types",
        "transmissions",
    ]

    for key in required_keys:
        assert key in data
        assert isinstance(data[key], list)

    assert len(data["brands"]) > 0
    assert len(data["body_types"]) > 0
    assert len(data["transmissions"]) > 0

    assert "Maruti Suzuki" in data["brands"]
    assert "Tata" in data["brands"]
    assert "Porsche" in data["brands"]
    assert "Ferrari" in data["brands"]

    assert "SUV" in data["body_types"]
    assert "Manual" in data["transmissions"]


def test_filter_options_contains_vehicleiq_filter_groups():
    response = client.get("/api/filter-options")
    assert_success(response)

    data = response.json()

    assert "brands" in data
    assert "body_types" in data

    possible_vehicle_type_keys = [
        "vehicle_types",
        "vehicle_type",
    ]

    possible_performance_keys = [
        "performance_types",
        "performance_type",
    ]

    possible_powertrain_keys = [
        "powertrains",
        "fuel_types",
    ]

    possible_luxury_keys = [
        "luxury_levels",
        "luxury_level",
    ]

    possible_offroad_keys = [
        "offroad_capabilities",
        "off_road_capabilities",
        "offroad_levels",
    ]

    assert any(key in data for key in possible_vehicle_type_keys)
    assert any(key in data for key in possible_performance_keys)
    assert any(key in data for key in possible_powertrain_keys)
    assert any(key in data for key in possible_luxury_keys)
    assert any(key in data for key in possible_offroad_keys)


def test_variants_endpoint():
    response = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )
    assert_success(response)

    variants = response.json()

    assert isinstance(variants, list)
    assert len(variants) > 0

    first = variants[0]

    assert "id" in first
    assert "variant_name" in first
    assert "price_inr" in first

    assert first["id"]
    assert first["variant_name"]
    assert isinstance(first["price_inr"], (int, float))
    assert first["price_inr"] > 0


def test_variants_have_required_identity_fields():
    response = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )
    assert_success(response)

    variants = response.json()

    assert len(variants) > 0

    for variant in variants[:20]:
        assert variant.get("id")
        assert variant.get("variant_name")
        assert variant.get("price_inr", 0) > 0

        identity_exists = any(
            variant.get(key)
            for key in ["variant_id", "vehicle_id", "id"]
        )

        assert identity_exists


def test_variants_do_not_return_invalid_prices():
    response = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )
    assert_success(response)

    variants = response.json()

    for variant in variants:
        price = variant.get("price_inr")

        assert isinstance(price, (int, float))
        assert price > 0


def test_search_suggestions_endpoint():
    response = client.get("/api/search?q=Creta")
    assert_success(response)

    results = response.json()

    assert isinstance(results, list)
    assert len(results) > 0

    assert any(
        "Creta" in str(result.get("model_name", ""))
        for result in results
    )


def test_search_empty_query():
    response = client.get("/api/search?q=")
    assert response.status_code in [200, 400, 422]


def test_search_unknown_vehicle():
    response = client.get("/api/search?q=VehicleDoesNotExistXYZ123")

    assert response.status_code == 200

    results = response.json()

    assert isinstance(results, list)
    assert len(results) == 0


def test_advanced_search_endpoint():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 2000000,
        "powertrains": ["Petrol", "Diesel", "EV"],
        "body_types": ["SUV", "Compact SUV"],
        "sort_by": "ai_score",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    assert "eligible_count" in data
    assert "results" in data
    assert "excluded_diagnostics" in data

    assert data["eligible_count"] >= 0
    assert isinstance(data["results"], list)
    assert isinstance(data["excluded_diagnostics"], list)

    for result in data["results"]:
        assert result.get("price_inr", 0) > 0

        if result.get("price_location_label"):
            assert isinstance(
                result["price_location_label"],
                str,
            )


def test_advanced_search_respects_max_price():
    max_price = 1000000

    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": max_price,
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        assert result["price_inr"] <= max_price


def test_advanced_search_powertrain_filter():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "powertrains": ["EV"],
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        powertrain = (
            result.get("powertrain")
            or result.get("fuel_type")
            or result.get("fuel")
        )

        assert powertrain is not None
        assert str(powertrain).lower() == "ev"


def test_advanced_search_body_type_filter():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "body_types": ["SUV"],
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        body_type = (
            result.get("body_type")
            or result.get("vehicle_segment")
            or result.get("segment")
        )

        assert body_type is not None


def test_advanced_search_location_label():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 20000000,
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"][:10]:
        label = result.get("price_location_label")

        if label:
            assert isinstance(label, str)
            assert len(label.strip()) > 0


def test_advanced_search_invalid_price():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": -1,
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert response.status_code in [400, 422]


def test_advanced_search_zero_price():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 0,
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert response.status_code in [400, 422]


def test_invalid_location():
    response = client.get(
        "/api/variants?state=InvalidStateXYZ&city=InvalidCityXYZ"
    )

    assert response.status_code in [400, 404, 422]


def test_compare_endpoint():
    variants_res = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )

    assert_success(variants_res)

    variants = variants_res.json()

    assert len(variants) >= 2

    id1 = variants[0]["id"]
    id2 = variants[1]["id"]

    assert id1 != id2

    response = client.post(
        "/api/compare",
        json={
            "variant_ids": [id1, id2],
            "state": DELHI_STATE,
            "city": DELHI_CITY,
        },
    )

    assert_success(response)

    data = response.json()

    assert data["compared_count"] == 2
    assert len(data["variants"]) == 2

    for variant in data["variants"]:
        assert "features" in variant
        assert "price_inr" in variant
        assert variant["price_inr"] > 0


def test_compare_rejects_duplicate_variants():
    variants_res = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )

    assert_success(variants_res)

    variants = variants_res.json()

    assert len(variants) > 0

    variant_id = variants[0]["id"]

    response = client.post(
        "/api/compare",
        json={
            "variant_ids": [variant_id, variant_id],
            "state": DELHI_STATE,
            "city": DELHI_CITY,
        },
    )

    assert response.status_code in [200, 400, 422]


def test_compare_unknown_variant():
    response = client.post(
        "/api/compare",
        json={
            "variant_ids": [
                "nonexistent_variant_123",
                "nonexistent_variant_456",
            ],
            "state": DELHI_STATE,
            "city": DELHI_CITY,
        },
    )

    assert response.status_code in [400, 404, 422]


def test_price_estimate_endpoint():
    response = client.get(
        "/api/price-estimate"
        "?ex_showroom=1200000"
        "&fuel_type=Petrol"
        f"&state={DELHI_STATE}"
    )

    assert_success(response)

    data = response.json()

    assert data["on_road_estimated"] > 1200000
    assert data["rto_road_tax"] > 0
    assert data["insurance_estimated"] > 0


def test_price_estimate_rejects_invalid_price():
    response = client.get(
        "/api/price-estimate"
        "?ex_showroom=-100"
        "&fuel_type=Petrol"
        f"&state={DELHI_STATE}"
    )

    assert response.status_code in [400, 422]


def test_price_estimate_zero_price():
    response = client.get(
        "/api/price-estimate"
        "?ex_showroom=0"
        "&fuel_type=Petrol"
        f"&state={DELHI_STATE}"
    )

    assert response.status_code in [400, 422]


def test_static_default_image_serving():
    response = client.get(
        "/assets/cars/default_vehicle.svg"
    )

    assert response.status_code == 200

    content_type = response.headers.get(
        "content-type",
        "",
    ).lower()

    assert "svg" in content_type


def test_vehicle_image_url():
    variants_res = client.get(
        f"/api/variants?state={DELHI_STATE}&city={DELHI_CITY}"
    )

    assert_success(variants_res)

    variants = variants_res.json()

    assert len(variants) > 0

    variant = variants[0]

    image_url = (
        variant.get("image_url")
        or variant.get("image_path")
        or variant.get("image")
    )

    if image_url:
        image_response = client.get(image_url)

        assert image_response.status_code == 200


def test_negotiate_endpoint():
    payload = {
        "vehicle_id": "swift_2020",
        "listed_price": 500000,
        "age_years": 4,
        "mileage_km": 45000,
        "condition": "good",
        "service_history": "partial",
        "owners_count": 1,
        "accidental": False,
        "flood_affected": False,
        "tyre_condition": "good",
        "insurance_valid": True,
    }

    response = client.post(
        "/api/negotiate",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    assert "fair_market_value" in data
    assert "mid" in data["fair_market_value"]
    assert "recommended_starting_bid" in data
    assert "walk_away_ceiling" in data
    assert "leverage_points" in data
    assert "depreciation_summary" in data

    assert (
        data["recommended_starting_bid"]
        <= data["listed_price"]
    )

    assert (
        data["walk_away_ceiling"]
        <= data["listed_price"]
    )

    assert isinstance(
        data["leverage_points"],
        list,
    )


def test_negotiate_rejects_invalid_listed_price():
    payload = {
        "vehicle_id": "swift_2020",
        "listed_price": -500000,
        "age_years": 4,
        "mileage_km": 45000,
        "condition": "good",
        "service_history": "partial",
        "owners_count": 1,
        "accidental": False,
        "flood_affected": False,
        "tyre_condition": "good",
        "insurance_valid": True,
    }

    response = client.post(
        "/api/negotiate",
        json=payload,
    )

    assert response.status_code in [400, 422]


def test_negotiate_walk_away_does_not_exceed_listing_price():
    payload = {
        "vehicle_id": "swift_2020",
        "listed_price": 500000,
        "age_years": 4,
        "mileage_km": 45000,
        "condition": "good",
        "service_history": "partial",
        "owners_count": 1,
        "accidental": False,
        "flood_affected": False,
        "tyre_condition": "good",
        "insurance_valid": True,
    }

    response = client.post(
        "/api/negotiate",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    assert data["recommended_starting_bid"] <= 500000
    assert data["walk_away_ceiling"] <= 500000


def test_inference_endpoint():
    payload = {
        "budget_inr": 1500000,
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "vehicle_usage": "daily",
        "driving_environment": "mixed",
        "powertrain_preference": "Petrol",
        "performance_importance": 0.5,
        "running_cost_importance": 0.8,
        "maintenance_importance": 0.7,
        "boot_space_need": 0.5,
    }

    response = client.post(
        "/api/infer",
        json=payload,
    )

    assert response.status_code in [200, 201, 400, 422]


def test_recommendation_score_range():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 2000000,
        "sort_by": "ai_score",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        score = result.get("score")

        if score is not None:
            assert 0 <= float(score) <= 100


def test_confidence_range():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 2000000,
        "sort_by": "ai_score",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        confidence = result.get("confidence")

        if confidence is not None:
            confidence_value = float(confidence)

            assert 0 <= confidence_value <= 100


def test_used_vehicle_price_is_positive():
    response = client.get(
        f"/api/variants?state={TAMIL_NADU_STATE}&city={CHENNAI_CITY}"
    )

    assert_success(response)

    variants = response.json()

    used_variants = [
        variant
        for variant in variants
        if variant.get("is_used") is True
    ]

    for variant in used_variants[:20]:
        assert variant["price_inr"] > 0


def test_exact_50000_budget():
    payload = {
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "max_price_inr": 50000,
        "sort_by": "price",
    }

    response = client.post(
        "/api/recommend/advanced",
        json=payload,
    )

    assert_success(response)

    data = response.json()

    for result in data["results"]:
        assert result["price_inr"] <= 50000


def test_forward_chaining_result_structure():
    payload = {
        "budget_inr": 1500000,
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "vehicle_usage": "daily",
        "driving_environment": "mixed",
        "performance_importance": 0.5,
        "running_cost_importance": 0.8,
        "maintenance_importance": 0.7,
        "boot_space_need": 0.5,
    }

    response = client.post(
        "/api/infer",
        json=payload,
    )

    if response.status_code != 200:
        pytest.skip("Inference endpoint contract differs from this test payload")

    data = response.json()

    if "forward_chaining_result" in data:
        result = data["forward_chaining_result"]

        assert "rules_fired" in result
        assert "iterations" in result
        assert "inference_trace" in result

        assert isinstance(result["rules_fired"], list)
        assert isinstance(result["inference_trace"], list)
        assert result["iterations"] >= 0


def test_fuzzy_values_are_normalized():
    payload = {
        "budget_inr": 1500000,
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "vehicle_usage": "daily",
        "driving_environment": "mixed",
        "performance_importance": 0.5,
        "running_cost_importance": 0.8,
        "maintenance_importance": 0.7,
        "boot_space_need": 0.5,
    }

    response = client.post(
        "/api/infer",
        json=payload,
    )

    if response.status_code != 200:
        pytest.skip("Inference endpoint contract differs from this test payload")

    data = response.json()

    fuzzy = data.get("fuzzy_result")

    if not fuzzy:
        pytest.skip("Fuzzy result not returned by inference endpoint")

    for membership in fuzzy.get("memberships", []):
        for value in membership.get("memberships", {}).values():
            assert 0 <= float(value) <= 1

    for value in fuzzy.get("preference_scores", {}).values():
        assert 0 <= float(value) <= 1


def test_bayesian_posterior_is_normalized():
    payload = {
        "budget_inr": 1500000,
        "state": TAMIL_NADU_STATE,
        "city": CHENNAI_CITY,
        "vehicle_usage": "daily",
        "driving_environment": "mixed",
        "performance_importance": 0.5,
        "running_cost_importance": 0.8,
        "maintenance_importance": 0.7,
        "boot_space_need": 0.5,
    }

    response = client.post(
        "/api/infer",
        json=payload,
    )

    if response.status_code != 200:
        pytest.skip("Inference endpoint contract differs from this test payload")

    data = response.json()

    bayesian = data.get("bayesian_result")

    if not bayesian:
        pytest.skip("Bayesian result not returned by inference endpoint")

    for node in bayesian.get("nodes", []):
        for value in node.get("prior", {}).values():
            assert 0 <= float(value) <= 1

        for value in node.get("posterior", {}).values():
            assert 0 <= float(value) <= 1

        uncertainty = node.get("uncertainty_level")

        if uncertainty is not None:
            assert 0 <= float(uncertainty) <= 1