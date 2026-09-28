"""Regression tests for truthful production-facing operational states."""


def test_unconfigured_integrations_are_not_reported_as_healthy(client):
    pipelines = client.get("/admin/data-health-pipelines")

    assert pipelines.status_code == 200
    by_name = {pipeline["name"]: pipeline for pipeline in pipelines.json()}
    assert by_name["IMD Regional Agromet Feed"]["status"] == "NOT CONNECTED"
    assert by_name["Farmer Delivery Gateway"]["status"] == "NOT CONNECTED"


def test_ml_metrics_expose_research_evidence_without_claiming_production(client):
    response = client.get("/ml/metrics")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "RESEARCH_DEMO"
    assert body["metrics"]["observation_pairs"] == 892


def test_demo_role_is_rejected_outside_development(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    response = client.get(
        "/advisories/district/operations-summary?district=Nagpur",
        headers={"X-Demo-Role": "admin"},
    )

    assert response.status_code == 401


def test_ml_metrics_require_a_valid_registered_artifact(client, monkeypatch, tmp_path):
    from app.config import settings

    invalid_artifact = tmp_path / "evaluation.json"
    invalid_artifact.write_text('{"status": "ACTIVE"}')
    monkeypatch.setattr(settings, "MODEL_EVALUATION_PATH", str(invalid_artifact))

    response = client.get("/ml/metrics")

    assert response.status_code == 200
    assert response.json()["status"] == "NOT_PRODUCTION_READY"


def test_interactive_downscaling_is_labelled_as_unvalidated_diagnostic(client):
    response = client.post("/ml/infer-downscale", json={})

    assert response.status_code == 200
    assert response.json()["model_version"] == "DIAGNOSTIC_SIMULATOR_UNVALIDATED"


def test_model_health_marks_research_evidence_as_non_production(client):
    response = client.get("/advisories/district/model-health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "RESEARCH_DEMO"
    assert body["baseline_mae_mm"] == 1.8545


def test_data_quality_does_not_claim_unverified_registry_or_weather_coverage(client):
    response = client.get("/admin/data-quality")

    assert response.status_code == 200
    overall = response.json()["overall"]
    assert overall["total_registered_panchayats"] == 2
    assert overall["official_boundary_registry_connected"] is False
    assert overall["panchayats_with_valid_lgd_code"] is None
    assert overall["panchayats_with_weather_coverage"] == 0
    assert overall["panchayats_without_weather_coverage"] == 2


def test_unregistered_benchmark_and_fallback_are_explicitly_unavailable(client):
    benchmark = client.get("/admin/model-benchmark-curve")
    fallback = client.post("/admin/simulate-fallback")

    assert benchmark.status_code == 200
    assert benchmark.json()["status"] == "NOT_PRODUCTION_READY"
    assert benchmark.json()["points"] == []
    assert fallback.status_code == 200
    assert fallback.json()["status"] == "NOT_READY"
    assert fallback.json()["checks"]


def test_production_disables_phone_only_login_and_unconfigured_otp(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DELIVERY_PROVIDER", "")
    monkeypatch.setattr(settings, "DELIVERY_API_KEY", "")

    login = client.post("/auth/login", json={"phone": "9999999999"})
    otp = client.post("/auth/farmer/request-otp", json={"phone": "9812345678"})

    assert login.status_code == 403
    assert otp.status_code == 503


def test_manual_send_and_broadcast_do_not_fabricate_delivery(client):
    manual_send = client.post("/advisories/1/send", headers={"X-Demo-Role": "officer"})
    broadcast = client.post(
        "/officers/broadcast",
        json={"message_text": "Check irrigation before rain."},
    )

    assert manual_send.status_code == 409
    assert broadcast.status_code == 200
    assert broadcast.json()["status"] == "NOT_AVAILABLE"
    assert broadcast.json()["sms_sent"] is None


def test_public_forecast_adapter_never_labels_open_meteo_as_imd():
    from app.providers.mausamgram import IMausamGramProvider

    provider = IMausamGramProvider()
    assert provider.authorized is False
