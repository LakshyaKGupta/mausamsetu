"""Unit tests for RBAC access control and state machine mutations."""

import pytest


def test_rbac_farmer_cannot_review_advisory(client):
    """Attempt: Farmer -> PATCH advisory review -> Expected: 403 Forbidden"""
    payload = {
        "action": "approved",
        "note": "Farmer trying to approve",
    }
    # Pass X-Demo-Role: farmer
    res = client.patch(
        "/advisories/1/review",
        json=payload,
        headers={"X-Demo-Role": "farmer"},
    )
    assert res.status_code == 403
    assert "not authorized" in res.json()["detail"].lower()


def test_rbac_officer_cannot_review_cross_block(client):
    """Attempt: Officer -> Review Panchayat outside assigned block -> Expected: 403 Forbidden"""
    payload = {
        "action": "approved",
        "note": "Rajesh trying to approve Hingna advisory",
    }
    # Rajesh (id=1, Kalmeshwar) attempts to review Advisory #2 (Seloo, Hingna)
    res = client.patch(
        "/advisories/2/review",
        json=payload,
        headers={"X-Demo-Role": "officer", "X-Officer-Id": "1"},
    )
    assert res.status_code == 403
    assert "cannot review advisories in hingna block" in res.json()["detail"].lower()


def test_rbac_district_admin_access(client):
    """Attempt: District Admin -> access assigned district (200), another district (403)"""
    # 1. Assigned district (Nagpur) -> 200 OK
    res_ok = client.get(
        "/advisories/district/operations-summary?district=Nagpur",
        headers={"X-Demo-Role": "admin"},
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["district"] == "Nagpur"

    # 2. Foreign district (Pune) -> 403 Forbidden
    res_err = client.get(
        "/advisories/district/operations-summary?district=Pune",
        headers={"X-Demo-Role": "admin"},
    )
    assert res_err.status_code == 403
    assert "cannot access operations in pune" in res_err.json()["detail"].lower()


def test_state_machine_mutation_synchronization(client):
    """
    Verification that Officer approval in Kalmeshwar mutates:
    - Kalmeshwar pending count (2 -> 1)
    - District pending count (7 -> 6)
    - Farmer approved advisory feed immediately reflects the approved advisory
    """
    # Baseline checks
    block_stats_before = client.get("/advisories/stats?block=Kalmeshwar").json()
    assert block_stats_before["pending_advisories"] == 2
    assert block_stats_before["approved_today"] == 22

    district_ops_before = client.get("/advisories/district/operations-summary?district=Nagpur").json()
    assert district_ops_before["pending_advisories"] == 7
    assert district_ops_before["approved_today"] == 71

    farmer_feed_before = client.get("/advisories/panchayat/1/approved").json()
    assert len(farmer_feed_before) == 0

    # Execute Approval by Rajesh Sharma for Kalmeshwar advisory #1
    review_res = client.patch(
        "/advisories/1/review",
        json={
            "action": "approved",
            "reason_category": "Local field observation",
            "note": "Soil moisture verified at Dhapewada AWS #104. Irrigation delay approved.",
        },
        headers={"X-Demo-Role": "officer", "X-Officer-Id": "1"},
    )
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "approved"

    # Verify Kalmeshwar block stats mutated
    block_stats_after = client.get("/advisories/stats?block=Kalmeshwar").json()
    assert block_stats_after["pending_advisories"] == 1
    assert block_stats_after["approved_today"] == 23

    # Verify District Operations center mutated
    district_ops_after = client.get("/advisories/district/operations-summary?district=Nagpur").json()
    assert district_ops_after["pending_advisories"] == 6
    assert district_ops_after["approved_today"] == 72
    # Verify Kalmeshwar block item in district ops mutated
    kalmeshwar_block = next(b for b in district_ops_after["blocks"] if b["block"] == "Kalmeshwar")
    assert kalmeshwar_block["pending_review"] == 1
    assert kalmeshwar_block["verified_today"] == 23

    # Verify Farmer endpoint immediately has the approved advisory
    farmer_feed_after = client.get("/advisories/panchayat/1/approved").json()
    assert len(farmer_feed_after) == 1
    assert farmer_feed_after[0]["id"] == 1
    assert farmer_feed_after[0]["status"] == "approved"
    assert farmer_feed_after[0]["crop"] == "soybean"
