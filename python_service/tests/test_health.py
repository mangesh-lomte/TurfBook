import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_liveness_probe():
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "TurfBook" in data["service"]
    assert data["docs"] == "/docs"

def test_pricing_endpoint_integration():
    payload = {
        "ground_id": "grd_live_01",
        "base_price_per_hour": 1500.0,
        "start_time": "2026-10-30T19:00:00",
        "end_time": "2026-10-30T20:00:00",
        "sport": "FOOTBALL",
        "is_indoor": False,
        "weather": "SUNNY"
    }
    response = client.post("/api/v1/pricing/quote", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["base_price"] == 1500.0
    assert data["pricing_tier"] == "SURGE"
    assert data["total_amount"] > 1500.0
