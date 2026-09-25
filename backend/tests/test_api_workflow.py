"""Tests for MausamSetu API workflows: auth, advisories, audit trails, and operations center."""

import pytest
from app.models.models import AdvisoryStatus


def test_unified_login_farmer(client):
    res = client.post("/auth/login", json={"phone": "9812345678"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "farmer"
    assert data["name"] == "Ramesh Patel"
    assert "access_token" in data


def test_unified_login_officer(client):
    res = client.post("/auth/login", json={"phone": "9876543210"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "officer"
    assert data["name"] == "Rajesh Sharma"
    assert data["block"] == "Kalmeshwar"


def test_unified_login_admin(client):
    res = client.post("/auth/login", json={"phone": "9999999999"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert data["name"] == "Dr. P. K. Deshmukh"


def test_progressive_farmer_signup(client):
    payload = {
        "name": "Kavita Bai",
        "phone": "9822334455",
        "state": "Maharashtra",
        "district": "Nagpur",
        "block": "Kalmeshwar",
        "panchayat_id": 1,
        "crops": ["cotton", "soybean"],
        "preferred_language": "mr",
        "land_area_acres": 2.5,
    }
    res = client.post("/auth/farmer/signup", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "farmer"
    assert data["name"] == "Kavita Bai"
    assert data["preferred_language"] == "mr"


def test_demo_sessions(client):
    for role in ("farmer", "officer", "admin"):
        res = client.get(f"/auth/demo-session/{role}")
        assert res.status_code == 200
        assert res.json()["role"] == role


def test_advisory_list_has_baseline_comparison(client):
    res = client.get("/advisories/")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    first = items[0]
    assert first["crop_stage"] == "Vegetative Stage"
    assert first["baseline_rainfall_mm"] == 4.5
    assert first["predicted_rainfall_mm"] == 3.8
    assert first["model_diff_mm"] == -0.7
    assert first["reliability_tier"] == "HIGH"


def test_officer_review_and_audit(client):
    # 1. Modify and approve advisory
    review_payload = {
        "action": "modified",
        "reason_category": "Field inspection",
        "note": "Drainage channels checked, soil is moist.",
        "modified_content_hi": "सिंचाई 24 घंटे टालें और जल निकासी नालियों की जांच करें।",
    }
    patch_res = client.patch("/advisories/1/review?officer_id=1", json=review_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "approved"
    assert "जल निकासी" in updated["content_hi"]

    # 2. Check audit trail
    audit_res = client.get("/advisories/1/audit")
    assert audit_res.status_code == 200
    audit = audit_res.json()
    assert audit["advisory_id"] == 1
    assert len(audit["history"]) >= 4
    stages = [h["stage"] for h in audit["history"]]
    assert "IMD Ingestion" in stages
    assert "Microclimate Downscaling" in stages
    assert "Officer Verification" in stages


def test_district_operations_summary(client):
    res = client.get("/advisories/district/operations-summary")
    assert res.status_code == 200
    data = res.json()
    assert data["district"] == "Nagpur"
    assert data["total_panchayats"] == 78
    assert len(data["alerts"]) >= 4
    assert len(data["blocks"]) == 4


def test_model_health(client):
    res = client.get("/advisories/district/model-health")
    assert res.status_code == 200
    data = res.json()
    assert data["baseline_mae_mm"] == 2.41
    assert data["mausamsetu_mae_mm"] == 1.38
    assert data["error_reduction_pct"] > 40
