# MausamSetu Production Readiness Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use `godmode:task-runner` to implement this plan task-by-task.

**Goal:** Make MausamSetu an honest, deployable Panchayat-level IMD forecast-downscaling service with a verified advisory and delivery loop.

**Architecture:** The Vite PWA is deployed to Vercel and calls a separately deployed FastAPI API over HTTPS. The API uses PostgreSQL and Alembic only in production. Official IMD/AWS and delivery providers sit behind explicit adapters; absent credentials create a visible unavailable state, never synthetic operational data.

**Tech Stack:** React/TypeScript/Vite/Tailwind/PWA; FastAPI/SQLAlchemy/Alembic/PostgreSQL; XGBoost artifacts; HTTPX; Playwright.

---

## Acceptance Criteria

1. No production route presents generated/demo weather, station status, operational counts, or delivery claims as live data.
2. Every forecast/advisory exposes source, issued timestamp, ingestion timestamp, freshness, model version, uncertainty, and fallback reason.
3. Approved advisories create durable delivery jobs. A worker/provider adapter records queued, sent, delivered, failed, and retry-exhausted events.
4. OTP, CORS, secret validation, audit logging, and migrations fail closed in production.
5. The XGBoost model can only be labelled active when its artifact, metadata, evaluation metrics, and reliability threshold are available.
6. Farmer feedback, consent, content version, and escalation are persisted and visible to the appropriate role.
7. Vercel frontend + Render API deployment is reproducible from documented environment variables and CI verifies both builds.
8. Farmer routes are touch-friendly at 390px, keyboard accessible, low-connectivity aware, and have clear loading/empty/error/freshness states.

## Non-Negotiable Data Integrity Rule

Never fabricate or hard-code production-facing weather values, telemetry, provider health, model metrics, counts, latency, delivery success, or coverage. When a value is not backed by a configured provider, persisted pilot dataset, or reproducible evaluation artifact, the UI must say `DEMO DATA`, `PILOT DATA`, `NOT CONNECTED`, `NO DATA`, or `UNAVAILABLE`.

## Task 0: Repository and architecture audit

**Files:** Create `docs/audits/2026-09-28-implementation-map.md`; inspect all existing routes, models, migrations, providers, ML artifacts, role pages, seed paths, geography, and operational KPIs.

1. Map each production-facing value from UI to API/service/database source.
2. Flag synthetic, demo, hard-coded, and unavailable dependencies without deleting functioning UI.
3. Identify the smallest surgical change-set for each false claim.
4. Record the existing controlled SIH demo path separately from production behavior.
5. Review this report before changing any production-facing contract.

## Task 1: Truthful data provenance and provider health

**Files:** `backend/app/config.py`, `backend/app/services/connectors/imd_connector.py`, `backend/app/services/weather_service.py`, `backend/app/api/weather.py`, `backend/app/api/admin.py`, `backend/tests/test_provider.py`.

1. Add a `PRODUCTION` configuration guard requiring an IMD endpoint/key and configured AWS connector before live forecast generation.
2. Return typed `unavailable`/`stale` status, provider name, source timestamps, and error category; do not turn a provider failure into invented meteorological values.
3. Make admin telemetry query recorded provider events, not fixed station numbers.
4. Add tests for missing credentials, timeout, invalid provider payload, stale cached data, and a successful normalized IMD payload.

## Task 2: Advisory governance and data model

**Files:** `backend/app/models/models.py`, `backend/app/schemas/schemas.py`, `backend/app/api/advisories.py`, new Alembic revision, `backend/tests/test_api_workflow.py`.

1. Add `advisory_content_versions`, `farmer_consents`, `farmer_feedback`, `delivery_jobs`, `delivery_events`, `provider_health_events`, and `escalations` tables with foreign keys and indexes.
2. Require an approved content version before a delivery job is created; preserve officer, rationale, language, model version, and provenance snapshot.
3. Route harmful/uncertain feedback to an escalation rather than silently changing advice.
4. Add state-machine tests from pending → approved → queued → delivered/failed.

## Task 3: Delivery outbox and provider adapters

**Files:** new `backend/app/services/delivery/`, `backend/app/api/delivery.py`, `backend/app/scripts/process_delivery_outbox.py`, tests.

1. Implement provider-neutral SMS, WhatsApp, IVR, and PWA adapters with configured credentials only.
2. Persist idempotency key, attempt count, next retry time, provider message ID, receipt status, and sanitized failure reason.
3. Add a bounded worker command that sends due jobs with exponential backoff and never re-sends a delivered job.
4. Add webhook endpoints that validate provider signatures before recording receipts.

## Task 4: Security and production database lifecycle

**Files:** `backend/app/main.py`, `backend/app/config.py`, `backend/app/api/auth.py`, `backend/app/api/deps.py`, `backend/app/db/session.py`, Alembic revision, `.env.example`, tests.

1. Remove automatic `create_all()` from the application lifecycle; migrations are run before startup.
2. Validate a non-default secret, HTTPS origins, provider secrets, and production database URL at boot.
3. Replace demo phone bypasses and OTP response leakage outside development; add rate limits and redacted auth audit logs.
4. Use timezone-aware UTC values and strict CORS allow-list parsing.

## Task 5: ML evidence and IMD problem-statement alignment

**Files:** `backend/app/ml/weather_downscaler.py`, `backend/app/api/ml_showcase.py`, `backend/app/api/weather.py`, model metadata, `docs/model-governance.md`, tests.

1. Treat XGBoost as a calibrated downscaling estimator, not an advisory author.
2. Publish training/evaluation coverage, held-out baseline comparison, reliability threshold, feature availability, prediction interval, and model/artifact checksum.
3. Block downscaling when required source/terrain features are missing; return official coarse data only when it is actually available.
4. Document the required pilot validation: matched IMD block forecasts, AWS/ARG observations, Panchayat geometry, crop-stage rules, and agronomist review.

## Task 5A: Reproducible ML evaluation pipeline

**Files:** new `ml/evaluation/`, versioned evaluation manifest/results, `backend/app/api/ml_showcase.py`, tests, and Admin types/components.

1. Generate every metric from a versioned matched forecast-observation dataset: periods, sample/station/Panchayat/block counts, lead times, baseline definition, MAE, RMSE, rain/no-rain precision/recall/F1, prediction-interval coverage, calibration error, and per-block/station/regime results.
2. Define the baseline as the official/coarse forecast applied directly at the target Panchayat.
3. Mark the model `NOT_PRODUCTION_READY` and use an available official fallback if held-out acceptance criteria are not met.
4. Never render a metric or chart that does not have a registered evaluation artifact.

## Task 5B: Model registry and governance

**Files:** model-registry model/migration/service/API; Admin ML Lab; tests.

1. Persist model ID/version, artifact path/checksum, dataset and feature-schema versions, periods, baseline/model/calibration metrics, interval method, required features, timestamps, and status.
2. Allowed states: `TRAINING`, `EVALUATING`, `CANDIDATE`, `ACTIVE`, `DEGRADED`, `RETIRED`, `REJECTED`.
3. Permit production inference only for a checksum-verified `ACTIVE` model with a passing registered evaluation and available required features.

## Task 5C: Functional interactive ML Lab

**Files:** `frontend/src/pages/app/ml/MLShowcase.tsx`, Admin navigation, model-evaluation API, Playwright tests.

1. Make “Launch Interactive” navigate to the lab and load registered evaluation data.
2. Show version, dataset, evaluation date, checksum, baseline comparison, actual-vs-predicted and error/uncertainty views, per-block/station/regime performance, feature availability/importance, and fallback decisions.
3. Provide date, hierarchy, station, regime, and lead-time filters.
4. If no evaluation is registered, show the specified unavailable state instead of demo metrics or charts.

## Task 5D: Geographic intelligence and data coverage

**Files:** geography models/API, map components, Admin coverage view, migrations, tests.

1. Use data-driven India → State → District → Block → Gram Panchayat hierarchy with stable IDs, parent IDs, names/translations, geometry/centroid, source/version, active status, and updated time.
2. Render a real drill-down map with boundaries where available, search, breadcrumb, legend, freshness, forecast/advisory/model/fallback/telemetry status, and assigned officer.
3. Add coverage states for forecast, observations, terrain, Panchayat geometry, crop data, model, and advisory. Pan-India architecture must be labelled separately from validated pilot coverage.
4. Rename any “3KM Downscaler” language to “Panchayat-Level Downscaler” or “Spatial Downscaling Model.”

## Task 5E: Reliability, provenance, and workflow chain

**Files:** weather/downscaling/advisory services, delivery/outbox models, Admin provenance view, tests.

1. Implement quality/reliability gates for provider freshness, terrain/geometry/features, active evaluated model, physical output bounds, and uncertainty.
2. Implement explicit freshness states: `FRESH`, `AGING`, `STALE`, `EXPIRED`, and `UNAVAILABLE`, with configurable thresholds.
3. Persist an immutable approval snapshot containing source/validity timestamps, model/rules/content versions, uncertainty, fallback decision, crop stage, officer, and approval time.
4. Make Admin trace Forecast → Downscaling → Reliability → Draft → Officer Review → Delivery → Feedback → Escalation for each advisory.

## Task 6: Mobile-first farmer experience and browser E2E

**Files:** farmer pages/components, `frontend/src/api/client.ts`, new Playwright tests.

1. Replace any optimistic “live” display with source/freshness/error states; preserve last verified advisory offline with its timestamp.
2. Confirm 44px+ touch targets, 16px form text on iOS, safe-area bottom navigation, Hindi/Marathi truncation, keyboard order, and aria labels.
3. Browser-test 390px farmer onboarding, source-unavailable state, approved advisory reading/TTS, feedback/escalation, officer approval, and admin delivery status.

## Task 7: Deployment, GitHub hygiene, and performance

**Files:** `vercel.json`, `render.yaml`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`, `docs/deployment.md`, `frontend/vite.config.ts`.

1. Configure Vercel SPA routing and `VITE_API_URL`; deploy FastAPI to Render with `alembic upgrade head` release command and managed PostgreSQL.
2. Add CI for backend tests, Alembic migration verification, frontend lint/build, and Playwright smoke test.
3. Split map/admin routes and vendor chunks; set a bundle budget and report it in CI.
4. Replace stale README badges/claims and document exact setup, secrets, migration, worker, rollback, and provider onboarding steps.

## External Inputs Required Before Live Enablement

- IMD API base URL, authenticated API contract, credential, and approved usage policy.
- AWS/ARG data source or gateway contract and credentials.
- One delivery provider per channel (SMS, WhatsApp, IVR), sender identity, templates, webhook/signing secret, and consent text approved by the deployment owner.
- Vercel team/project and Render account/service/database access if you want me to create the remote deployments rather than only add repository configuration.
