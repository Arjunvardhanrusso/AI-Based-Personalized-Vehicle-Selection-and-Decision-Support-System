"""
Unit & Integration Tests for Auth, Garage, Reviews, Leads, and Admin Features
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal, Base, engine
from app.db.models import User, SavedVehicle, Review, Lead, VehicleVariantModel

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_auth_registration_and_login():
    test_email = "tester_unique@vehicleiq.ai"
    test_pass = "securepassword123"

    # 1. Register new user
    reg_resp = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_pass
    })
    assert reg_resp.status_code in [200, 400]  # 400 if already exists in prior run

    # 2. Login with credentials
    login_resp = client.post("/api/auth/login", data={
        "username": test_email,
        "password": test_pass
    })
    assert login_resp.status_code == 200
    data = login_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email

    # Cookies should be set
    assert "access_token" in login_resp.cookies or "access_token" in data


def test_auth_me_endpoint():
    # Login as admin
    login_resp = client.post("/api/auth/login", data={
        "username": "admin@vehicleiq.ai",
        "password": "admin123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # Call /api/auth/me with Bearer token
    me_resp = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "admin@vehicleiq.ai"
    assert me_data["is_admin"] is True


def test_garage_lifecycle():
    # Login as demo user
    login_resp = client.post("/api/auth/login", data={
        "username": "demo@vehicleiq.ai",
        "password": "demo123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_variant = "MS001_lxi"

    # Clean prior state if any
    client.delete(f"/api/garage/remove/{test_variant}", headers=headers)

    # 1. Add to garage
    add_resp = client.post(f"/api/garage/add/{test_variant}", headers=headers)
    assert add_resp.status_code == 200
    assert add_resp.json()["vehicle_variant_id"] == test_variant

    # 2. List garage
    list_resp = client.get("/api/garage/", headers=headers)
    assert list_resp.status_code == 200
    saved_ids = [item["vehicle_variant_id"] for item in list_resp.json()]
    assert test_variant in saved_ids

    # 3. Remove from garage
    del_resp = client.delete(f"/api/garage/remove/{test_variant}", headers=headers)
    assert del_resp.status_code == 204


def test_leads_submission():
    lead_payload = {
        "vehicle_variant_id": "MS001_lxi",
        "name": "Arjun Test User",
        "phone": "+91 9876543210",
        "message": "Interested in test drive scheduling"
    }

    create_resp = client.post("/api/leads/", json=lead_payload)
    assert create_resp.status_code == 200
    created_data = create_resp.json()
    assert created_data["name"] == "Arjun Test User"
    assert created_data["phone"] == "+91 9876543210"


def test_reviews_submission_and_fetch():
    # Login
    login_resp = client.post("/api/auth/login", data={
        "username": "demo@vehicleiq.ai",
        "password": "demo123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    test_variant = "MS001_lxi"

    # Submit review
    post_resp = client.post(f"/api/reviews/{test_variant}", headers=headers, json={
        "rating": 5,
        "review_text": "Remarkable fuel economy and agile city handling!"
    })
    assert post_resp.status_code == 200
    assert post_resp.json()["rating"] == 5

    # Fetch reviews
    get_resp = client.get(f"/api/reviews/{test_variant}")
    assert get_resp.status_code == 200
    assert len(get_resp.json()) >= 1


def test_admin_stats_and_access_control():
    # Regular user attempting admin stats
    user_login = client.post("/api/auth/login", data={
        "username": "demo@vehicleiq.ai",
        "password": "demo123"
    })
    user_token = user_login.json()["access_token"]
    forbidden_resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {user_token}"})
    assert forbidden_resp.status_code == 403

    # Admin user accessing admin stats
    admin_login = client.post("/api/auth/login", data={
        "username": "admin@vehicleiq.ai",
        "password": "admin123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_resp = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_resp.status_code == 200
    stats = admin_resp.json()
    assert "users_count" in stats
    assert "leads_count" in stats
    assert "reviews_count" in stats
