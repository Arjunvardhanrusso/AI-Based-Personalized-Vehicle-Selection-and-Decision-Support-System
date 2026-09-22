"""
Tests for Vehicle Image Resolver Service and API Endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.vehicle_image_service import vehicle_image_service
from app.models.vehicle_image import VehicleImageResponse


@pytest.fixture
def client():
    return TestClient(app)


def test_brand_normalization():
    """Verify brand name normalization handles common Indian variations."""
    assert vehicle_image_service.normalize_brand("Maruti Suzuki India") == "Maruti Suzuki"
    assert vehicle_image_service.normalize_brand("Hyundai Motor India") == "Hyundai"
    assert vehicle_image_service.normalize_brand("Tata Motors") == "Tata"
    assert vehicle_image_service.normalize_brand("BMW India") == "BMW"
    assert vehicle_image_service.normalize_brand("Mercedes Benz") == "Mercedes-Benz"


def test_model_normalization():
    """Verify model normalization cleans trims, years, engines, and powertrain tags per prompt specification."""
    assert vehicle_image_service.normalize_model("Hyundai Exter CNG Sportz", "Hyundai") == "Exter"
    assert vehicle_image_service.normalize_model("Hyundai Aura CNG SX(O)", "Hyundai") == "Aura"
    assert vehicle_image_service.normalize_model("Hyundai Grand i10 Nios CNG SX(O)", "Hyundai") == "Grand i10 Nios"
    assert vehicle_image_service.normalize_model("Tata Nexon CNG Adventure", "Tata") == "Nexon"
    assert vehicle_image_service.normalize_model("Pre-Owned Swift VXi 2020", "Maruti Suzuki") == "Swift"
    assert vehicle_image_service.normalize_model("Creta SX(O) 1.5 Turbo DCT", "Hyundai") == "Creta"


def test_body_type_fallback():
    """Verify all automotive segments have dedicated Sleek Slate vector graphics."""
    assert vehicle_image_service.resolve_body_type_fallback("SUV") == "/images/fallbacks/suv.svg"
    assert vehicle_image_service.resolve_body_type_fallback("Sedan") == "/images/fallbacks/sedan.svg"
    assert vehicle_image_service.resolve_body_type_fallback("Hatchback") == "/images/fallbacks/hatchback.svg"
    assert vehicle_image_service.resolve_body_type_fallback("Supercar") == "/images/fallbacks/supercar.svg"
    assert vehicle_image_service.resolve_body_type_fallback("4x4") == "/images/fallbacks/offroad.svg"
    assert vehicle_image_service.resolve_body_type_fallback("unknown_type") == "/images/fallbacks/default-car.svg"


def test_vehicle_image_endpoint(client):
    """Verify GET /api/vehicles/{vehicle_id}/image resolves correctly."""
    response = client.get("/api/vehicles/MS001_lxi/image")
    assert response.status_code == 200
    data = response.json()
    assert data["vehicle_id"] == "MS001_lxi"
    assert "image_url" in data
    assert data["image_url"].startswith("http") or data["image_url"].startswith("/images/fallbacks/")


def test_vehicle_image_endpoint_custom_query(client):
    """Verify custom brand, model, and body_type parameters cascade smoothly to real CDN images or SVG fallbacks."""
    response = client.get("/api/vehicles/custom_query_test/image?brand=Toyota&model=Fortuner&body_type=suv")
    assert response.status_code == 200
    data = response.json()
    assert data["vehicle_id"] == "custom_query_test"
    assert data["image_url"].startswith("http") or data["image_url"].startswith("/images/fallbacks/") or data["image_url"].startswith("/assets/cars/")
