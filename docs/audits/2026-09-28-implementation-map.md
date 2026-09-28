# MausamSetu Implementation Map and Data-Integrity Audit

**Scope:** Task 0 audit before production-facing changes. This is an evidence report, not a claim that the pilot is operational.

## Architecture discovered

- Frontend: React/Vite routes for public, auth, Farmer, Officer, Admin, and ML Lab views in `frontend/src/main.tsx`.
- Backend: FastAPI routers for auth, geography, weather, advisories, officers, field reports, admin, ML showcase, chatbot, and farmer routes. Routers are mounted at both root and `/api` paths in `backend/app/main.py`.
- Persistence: two overlapping ORM model families exist (`app/models/models.py` and `app/models/{location,weather,advisory,officer_ops}.py`) using different base-module imports. Alembic history exists, but application startup still calls `Base.metadata.create_all()`.
- ML: a weather downscaler and XGBoost artifacts exist. The production ML inference route in `api/ml_showcase.py` currently calculates deterministic physics-style values; it does not load a registry-controlled artifact before claiming XGBoost inference.
- Geography: LGD-oriented State/District/Block/Panchayat models exist with coverage and geometry-source fields. Parallel legacy Panchayat models and static `STATES_DATA` paths remain.

## Production-facing trace findings

| Surface | Current source | Finding | Required correction |
|---|---|---|---|
| Farmer weather | Open-Meteo path and fallback defaults | Open-Meteo is a development/fallback source, not official IMD data. | Render source, issue time, freshness, fallback reason, and unavailable state. |
| IMD connector | `IMDConnector` | Correct adapter shape exists but has no configured credential/verified contract in this workspace. | Keep disabled until contract/key and normalized-payload test are available. |
| Admin provider health | `api/admin.py` fixed response | Claims healthy IMD, 12 AWS nodes, active delivery gateway, timestamps, and latency without persisted events. | Replace with provider-health records or `NOT CONNECTED`. |
| Admin ML metrics | `api/ml_showcase.py` and frontend fallback | MAE/RMSE/error reduction/sample count and station results are hard-coded. | Replace with versioned evaluation artifact or unavailable ML Lab state. |
| ML interactive inference | `api/ml_showcase.py` | Response uses hand-written equations, fixed latency, and a fixed version string while labelled XGBoost. | Load only registered active artifact; otherwise show diagnostic unavailable state. |
| Admin spatial map | `Admin.tsx` static India hierarchy and coordinates | Demonstration geography is embedded in the client. | Query hierarchy/coverage API and render only available geometry. |
| Operational counts | advisory fixes now use persisted queue where records exist; other Admin/Officer values remain fixed | Current UI mixes live queue state with static station/delivery/coverage claims. | Convert each card independently to persisted source or clear demo/pilot label. |
| Delivery | Officer and landing UI describe SMS/WhatsApp delivery | No delivery outbox, provider adapter, receipt, or idempotency model found. | Build outbox before displaying delivery results. |
| Authentication | `api/auth.py`, `api/deps.py` | Demo phone paths and `X-Demo-Role` authority override are active; development OTP is exposed. | Restrict demo paths to development; derive production role only from authenticated account. |

## Hard-coded pilot coupling found

- Nagpur, Maharashtra, Kalmeshwar, Dhapewada, and Panchayat ID `1` appear in auth defaults, schemas, weather fallbacks, geography fallbacks, signup, map components, PDF exports, and seeded UI lists.
- The newer geography tables have LGD fields and hierarchy identifiers, but business logic still frequently queries names/defaults rather than hierarchy IDs.
- Result: the repository has a promising India-first data model, but not yet an India-first runtime architecture.

## Existing strengths to preserve

1. Officer review before farmer publication is the right safety boundary.
2. Advisory templates are deterministic and multilingual; an LLM is not allowed to author agronomic action.
3. Existing Alembic history, LGD geometry provenance fields, forecast provenance fields, PWA shell, and validation experiment files are useful foundations.
4. The mobile farmer navigation, safe-area handling, and offline shell should be retained while data states are made truthful.

## Controlled demo versus production

- **Permitted demo mode:** explicitly marked seeded Nagpur pilot data; isolated demo credentials; controlled end-to-end SIH scenario.
- **Production mode:** no demo authorization, no synthetic operational KPIs, no active ML model without registered evaluation, no delivery success without a persisted receipt, and no weather fallback without a real provider response/cache.

## First surgical implementation slice

1. Introduce an environment-aware `DEMO`/`PILOT`/`PRODUCTION` mode and remove production claims from unconfigured routes.
2. Replace the Admin provider-health and ML-metrics endpoints with typed unavailable responses until persisted evidence is registered.
3. Add model registry/evaluation tables and a migration before changing the ML Lab presentation.
4. Preserve the existing Admin visual shell; bind its cards, map, and Lab to the new status APIs rather than replacing the interface.
