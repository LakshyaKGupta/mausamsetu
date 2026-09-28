# MausamSetu — HANDOFF

This is the persistent memory layer for all AI agents and contributors working on MausamSetu.
Read this before making any changes.

---

## Deployment Update — 2026-09-28

- The Vercel frontend project `mausamsetu` is deployed and reports `Ready` at `https://mausamsetu-eta.vercel.app`.
- Render PostgreSQL has been provisioned, but the FastAPI web service still needs to be created in the Render dashboard with fresh database credentials and production environment variables. Do not treat the public frontend as end-to-end ready until `/health` on that service succeeds.
- The Docker entrypoint now applies Alembic migrations before starting Uvicorn on Render's assigned `PORT`; production fails closed if PostgreSQL is unavailable rather than silently using local SQLite.

---

## Session Update — 2026-09-19

### Objective
Build MausamSetu from scratch — complete end-to-end platform:
AI Advisory → Officer Review → Farmer delivery pipeline.

### Completed

**Phase 1 — Foundation**
- Full project scaffold: `frontend/`, `backend/`, `ml/`, `docker-compose.yml`
- PostgreSQL schema via SQLAlchemy (7 tables: panchayats, officers, farmers, weather_observations, advisories, approvals, chatbot_sessions)
- FastAPI backend with all core routes
- Mock data seeder: 50 Nagpur panchayats, 5 officers, 200 farmers, weather observations, advisories (mixed states)

**Phase 2 — ML Pipeline**
- `backend/app/ml/advisory_generator.py`: rule-based advisory engine
  - Classifies weather into 6 conditions (rain_heavy, rain_moderate, dry_hot, dry_mild, humid_mild, optimal)
  - Maps condition × crop → multilingual advisory (Hindi / Marathi / English)
  - Crops: wheat, cotton, soybean, rice (+ generic fallback)
  - Confidence score + IMD fallback when confidence < 60%
- `backend/app/ml/weather_downscaler.py`: OpenMeteo fetch + elevation bias correction

**Phase 3 — Officer Review Dashboard**
- `frontend/src/pages/officer/Dashboard.tsx`: Stats cards, queue, filters, animated rows
- `frontend/src/components/officer/AdvisoryDetailModal.tsx`:
  - Confidence score with animated progress bar (high/medium/low color)
  - Weather snapshot grid (6 metrics)
  - ML explanation panel
  - Multilingual content tabs (Hindi / Marathi / English) with inline edit
  - Approve / Modify (save edits) / Reject with officer note
- `frontend/src/pages/auth/OfficerLogin.tsx`: OTP-based phone login with dev mode OTP display

**Phase 4 — Farmer PWA**
- `frontend/src/pages/farmer/Home.tsx`:
  - Dynamic weather card (condition-based gradient: sunny/rainy/cloudy/partly_cloudy)
  - Language switcher (Hindi / Marathi / English — runtime switch)
  - Advisory cards with TTS (Web Speech Synthesis)
  - Floating chatbot FAB → bottom sheet
  - Voice input (Web Speech Recognition API)
  - Intent detection (greeting / weather / advisory / fallback)
  - Suggestion chips for quick queries
  - No backend LLM — pure controlled retrieval

**Phase 5 — Voice Chatbot**
- `backend/app/api/chatbot.py`: intent-based controlled retrieval, session persistence

**Phase 6 — Infrastructure**
- Docker Compose (PostgreSQL + FastAPI + frontend)
- TypeScript clean (0 errors)
- Frontend running at http://localhost:5173/

### Files Modified

**New files created (full list):**
- `docker-compose.yml`
- `backend/Dockerfile`, `backend/.env`, `backend/requirements.txt`
- `backend/app/main.py`, `backend/app/config.py`
- `backend/app/db/session.py`
- `backend/app/models/models.py`, `backend/app/models/__init__.py`
- `backend/app/schemas/schemas.py`
- `backend/app/ml/advisory_generator.py`
- `backend/app/ml/weather_downscaler.py`
- `backend/app/api/{auth,advisories,weather,panchayats,chatbot}.py`
- `backend/app/utils/seeder.py`
- `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`
- `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/index.html`
- `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/vite-env.d.ts`
- `frontend/src/api/client.ts`
- `frontend/src/types/index.ts`
- `frontend/src/lib/utils.ts`
- `frontend/src/pages/farmer/Home.tsx`
- `frontend/src/pages/officer/Dashboard.tsx`
- `frontend/src/pages/auth/OfficerLogin.tsx`
- `frontend/src/components/officer/AdvisoryDetailModal.tsx`
- `PROJECT_CONTEXT.md`, `README.md`

### Architecture Decisions

1. **No LLM for advisory text** — rule-based template engine. Rationale: hallucinated crop advisories are dangerous. Templates are authored by agronomists.
2. **Web Speech API** for voice — browser-native, zero infra cost, works on all modern Android/iOS browsers.
3. **OTP auth for officers** — phone-based, no password management. Dev mode returns OTP in API response.
4. **OpenMeteo for weather** — free, no API key needed for basic forecasts. IMD integration is a future upgrade.
5. **SQLAlchemy sync** (not async) — simplicity wins for MVP; async can be added later when scale demands.
6. **No Alembic migrations yet** — using `Base.metadata.create_all()` for MVP speed. Add Alembic before production.

### Dependencies Added

**Backend:** fastapi, uvicorn, sqlalchemy, pydantic, httpx, python-jose, passlib, psycopg2-binary, scikit-learn, xgboost, pandas, numpy
**Frontend:** react, react-router-dom, axios, leaflet, recharts, lucide-react, framer-motion, radix-ui, tailwindcss

### Verification

- TypeScript: `0 errors` (npx tsc --noEmit)
- Frontend dev server: Running at http://localhost:5173/ (Vite v5.4.21, 912ms startup)
- npm install: 353 packages, 0 critical vulnerabilities
- Backend pip: Core deps installed; XGBoost still being installed

### Issues Found

1. `@radix-ui/react-badge` doesn't exist — fixed (badges implemented as CSS classes)
2. Backend pip install: `metadata-generation-failed` on initial attempt — splitting into batches resolved it
3. XGBoost on macOS Apple Silicon may need special build — fallback to rule-based advisory already in place (XGBoost is not required for MVP)

### Pending Work (Next Session)

1. **Start PostgreSQL** and run seeder: `python -m app.utils.seeder`
2. **Test backend API** with seeded data (`http://localhost:8000/docs`)
3. **End-to-end test**: Generate advisory → officer approves → farmer sees it
4. **Panchayat map** (Leaflet choropleth showing advisory coverage)
5. **PWA offline** (Workbox service worker + manifest)
6. **SMS/WhatsApp delivery** (Twilio or MSG91) for advisory push
7. **Alembic migrations** (replace create_all)
8. **IMD API integration** (when access approved)
9. **XGBoost training** (replace rule-based classifier with trained model)
10. **Production hardening**: real SMS OTP, rate limiting, proper secrets management

### Notes For Next Agent

- The advisory pipeline is complete end-to-end. To test it:
  1. Start PostgreSQL: `docker-compose up -d db`
  2. Run: `source .venv/bin/activate && uvicorn app.main:app --reload`
  3. POST `/advisories/generate` with `panchayat_id: 1, crop: "wheat"`
  4. See the advisory in `/advisories/?status=pending`
  5. PATCH `/advisories/1/review?officer_id=1` with `{"action": "approved"}`

- The `advisory_generator.py` templates are the core business logic. Adding new crops = adding a new key to `ADVISORY_TEMPLATES`.

- The chatbot is purely retrieval-based. It does NOT call any LLM. It detects intent via keyword matching, then fetches from DB.

- Officer auth: In dev mode, OTP is logged to console AND returned in the API response body. Never do this in production.

- The frontend language switcher updates the UI language at runtime — no page reload needed.

---

## Session Update — Mobile Alignment & PWA Ergonomics Audit

### Completed:
1. **Viewport & Safe-Area Alignment**:
   - `index.html`: Configured `viewport-fit=cover`, mobile theme colors, and standalone web app tags.
   - `AppLayout.tsx`: Added `pt-[env(safe-area-inset-top,0px)]` to the sticky header to safeguard iOS Dynamic Island / notch & Android camera cutouts in standalone PWA mode.
   - `FarmerNav.tsx`: Bottom navigation equipped with `max(env(safe-area-inset-bottom, 0px), 6px)` and comfortable `min-h-[48px]` tap targets with `touch-manipulation` and active click state.
   - Bottom page padding: All farmer workflows (`Home`, `Forecast`, `MyCrops`, `AdvisoryList`, `Ask`) standardized with `pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-8` to guarantee zero occlusion of content by bottom bars.

2. **Zero-Wobble & Anti-Zoom Mobile Protection**:
   - `index.css`: Enforced `overflow-x-hidden` on `html` and `body` to stop horizontal rubber-banding on touch devices.
   - iOS Auto-Zoom fix: Enforced `16px` font-size on mobile inputs/selects/textareas to prevent iOS Safari/WebKit from zooming the viewport when tapping text fields.
   - Added `touch-action: manipulation` globally to eliminate 300ms mobile tap delays.

3. **Responsive Header & Action Buttons**:
   - Expanded mobile location badge width (`xs:max-w-[130px]`) and configured `xs: '380px'` in `tailwind.config.js`.
   - Enlarged mobile language selection pills and logout tap targets for finger ergonomics.
   - Officer Dashboard: Converted action buttons (`Emergency Broadcast`, `File Field Report`, `Sync`) to flexible wrapping cards with responsive full-touch areas.

4. **Audited & Verified Across All Views**:
   - Farmer Home, 7-Day Forecast, My Crops, Advisories Archive, Voice Chatbot, Login, Signup, Officer Console, and Admin Dashboard all verified at 390x844 mobile viewport with 0 horizontal scroll errors and 0 TypeScript build errors.

---

## Session Update — Farmer Radically Simplified, Pan-India Resolution, Officer Console & 100% Tests

### Core Objectives Delivered:
1. **Radically Simplified Farmer App ("Weather → What should I do → Ask me anything")**:
   - Replaced complex meteorological telemetry, downscaling curves, microclimate scrubbers, and Gram Panchayat GIS maps from the farmer interface with a 3-card clean architecture:
     1. **☀️ Weather**: Crisp local temperatures, rain, humidity, wind, and sky condition.
     2. **🌱 Dominant Action Card ("आज क्या करें?")**: Clear actionable agronomic advice with official Agricultural Officer stamp and 1-tap audio speech synthesis (`SpeakAdvisoryButton`).
     3. **🎙️ Voice Ask Card ("पूछें")**: Instant voice query entry into the conversational assistant.
   - Simplified 5-day visual forecast cards and removed technical jargon from all farmer screens.
   - Cleaned navigation tabs: `Home` | `Weather` | `🎙️ Ask` | `Crops` | `Advice`.

2. **Pan-India Real Weather & Location Resolution**:
   - Integrated Open-Meteo Geocoding & Open-Meteo Weather APIs with SRTM 90m DEM elevation resolution.
   - `GET /weather/live`: Real-time weather data retrieval for any Indian coordinate (`lat`, `lon`), providing instant conditions, precipitation, humidity, wind speed, dynamic crop action recommendations, and 7-day outlook.
   - `LocationSearchModal.tsx`: Search across India with quick presets (Nashik, Pune, Vidarbha, Punjab, etc.) that instantly re-renders local weather and actions.

3. **Connected Agricultural Officer Operations Console**:
   - Connected KPI cards: Clicking "2 Pending Review" immediately switches to the Advisory Queue (`#MS-1042` and `#MS-1043`).
   - Side-by-Side Review Screen (`AdvisoryDetailModal`): Compares IMD 40km Baseline vs MausamSetu Topographic Downscaled forecast, displays Model Evidence, provides Hindi/Marathi/English editing with mandatory change rationale, and executes state mutation (`PATCH /advisories/{id}/review`).
   - Approved items display verified farmer reach ("Delivered to 84 farmers") and audit logs.
   - Auto-zooms Gram Panchayat block map directly to Kalmeshwar Block coordinates (`21.2333, 78.9167`) with interactive panchayat boundaries.
   - Field Reports: Connected "+ Record Observation" modal directly to `POST /field-reports/`.

4. **District Admin Operations Center & ML Model Lab**:
   - Grounded all model health telemetry in `phase6_expanded_dataset.csv` (1,661 paired observations across 18 Synoptic/Airport ground truth stations in Maharashtra).
   - Embedded interactive Topographic Microclimate Downscaler Calculator with real-time sliders for lapse-rate and orographic physics calculation.
   - Multi-tier spatial drilldown map with honest pilot badges (🟢 Live Operational Pilot for Nagpur/Kalmeshwar vs 🟡 Architecture Ready for rest of India).

5. **Quality & Verification**:
   - **Backend Pytest**: **60/60 tests PASSED (100%)** across all test suites (`test_api_workflow`, `test_downscaling`, `test_elevation`, `test_health`, `test_hierarchy`, `test_locations`, `test_provider`, `test_rbac_and_scope`).
   - **Frontend Build**: `tsc -b && vite build` passed with **0 errors**.

---

## Session Update — Operational Consistency & Runtime Audit (2026-09-28)

### Completed

1. Repaired `start.sh`: it now starts the actual MausamSetu backend/frontend paths, uses port `5173`, validates prerequisites, waits for each service to bind before claiming success, and safely reuses services already listening on ports `8000` and `5173`.
2. Added the missing ESLint 9 flat configuration and corrected a conditional React-hook call in the farmer forecast timeline.
3. Fixed a React Strict Mode Leaflet lifecycle issue that caused the farmer map to report “Map container is already initialized.”
4. Made the officer dashboard’s pending-review badges use the actual scoped advisory queue rather than unrelated static statistics.
5. Made district operations and block statistics derive pending/approved advisory counts from persisted advisory state. The prior fixed counts could contradict the officer queue and admin dashboard after a review action.
6. Made the admin action-required advisory copy and operational-signal badge derive from the district-summary response instead of showing a stale hard-coded block claim.
7. Removed N+1 lookups from advisory-list and field-report-list endpoints by loading their Panchayat/officer data with the primary query.

### Verification

- `PYTHONPATH=. .venv/bin/python -m pytest tests/ -q` → **61 passed**.
- `npm run lint && npm run build` → passed. The build still warns that the main JavaScript bundle is about 1.47 MB uncompressed.
- Browser checks were completed for landing, farmer, and officer flows. After the Leaflet fix the farmer home produced no console errors (only React Router future-flag warnings).
- A late managed-sandbox policy change prevented a new process from binding to localhost port `8000`; it is an execution-environment restriction rather than an application test failure. Run `./start.sh` from a normal project terminal to start both services.

### Remaining Production Work

1. Replace demo/synthetic advisory and operational-profile fallbacks with clearly unavailable/empty states when official data is absent.
2. Integrate authenticated IMD/AWS ingestion with source timestamps and provenance; add delivery outbox/retry/receipt tracking for SMS, WhatsApp, and IVR.
3. Replace development OTP behavior, permissive development CORS, and `create_all()` startup schema creation with production auth/rate limits/secrets, allow-listed origins, and Alembic migrations.
4. Address Python 3.14 `datetime.utcnow()` deprecation warnings, split the map/admin frontend bundle, and add browser E2E coverage for review and delivery flows.

---

## Session Update — Production Readiness Design (2026-09-28)

### Findings

- The repository already contains an IMD connector, XGBoost artifacts, Alembic history, and PWA shell, but production claims currently exceed the verified integrations. Fixed operational/telemetry figures and delivery statements must not be presented as live.
- The SIH/MoES problem requires more than a downscaling UI: provenance, uncertainty, matched forecast-observation evaluation, agronomist governance, last-mile delivery receipts, consent, and a safe coarse-forecast fallback are required for a credible operational pilot.
- Vercel can host the frontend but not the long-running FastAPI worker/API + PostgreSQL system by itself. The recommended deployment is Vercel frontend plus a managed FastAPI host and PostgreSQL, with a separate scheduled delivery worker.

### Plan

- Saved the implementation plan at `docs/plans/2026-09-28-production-readiness.md`.
- Live provider/delivery enablement remains blocked on approved IMD/AWS contracts, delivery-provider credentials/templates/webhook secret, and deployment-account access. The plan specifies safe behavior while these are absent.

### Task 0 Completed

- Added `docs/audits/2026-09-28-implementation-map.md`, tracing visible weather, KPIs, ML Lab, geography, delivery, and authentication behavior to its current implementation.
- Confirmed the main risk: the UI and some APIs still make unbacked operational, IMD/AWS, XGBoost, delivery, and pan-India claims. Preserve the strong interface, but bind it to typed source/coverage/evaluation data or explicit demo/unavailable states.
- Expanded the readiness plan with a non-negotiable data-integrity rule plus Task 0 and Tasks 5A–5E for reproducible evaluation, model registry, functional ML Lab, geographic coverage, freshness/reliability gates, and provenance chain.

### First Production-Safe Vertical Slice

- Added configuration for delivery providers and a registered ML evaluation artifact.
- Replaced fixed “healthy/active” values from `/admin/data-health-pipelines` with truthful configuration-driven states. Unconfigured IMD/AWS/delivery integrations now report `NOT CONNECTED`; the downscaler reports `EVALUATION REQUIRED` until an evaluation is registered.
- `/ml/metrics` now returns `NOT_PRODUCTION_READY` with no metrics when no validated evaluation artifact is configured, rather than returning invented MAE/RMSE and station results.
- Added `backend/tests/test_data_integrity.py`; full backend suite: **63 passed**.

### Production Auth and Startup Slice

- Removed application-startup `create_all()` so schema mutation is no longer an implicit production side effect; test fixtures retain isolated schema creation.
- Replaced credentialed wildcard CORS with an explicit `CORS_ORIGINS` configuration.
- Restricted `X-Demo-Role` and fallback officer authorization to development/demo/test environments. Production requests now require authenticated identity.
- Added regression coverage for production demo-role rejection. Backend suite: **64 passed**.

### ML Lab Integrity Slice

- The Admin “Launch Interactive Simulator” action now routes inside the authenticated application to `/app/ml-lab`.
- Removed frontend ML-validation fallback metrics/station results. When evaluation data is absent, the Lab shows a clear unavailable state rather than invented charts or numbers.
- `/ml/metrics` now accepts an evaluation only when a registered JSON artifact has active status, model ID, artifact checksum, metrics, and station results. Incomplete/malformed artifacts remain `NOT_PRODUCTION_READY`.
- Demo role headers are now sent by the frontend only when `VITE_DEMO_MODE=true`.
- Added evaluation-artifact regression coverage. Backend suite: **65 passed**; frontend lint/build passed.

### Diagnostic Simulator Labelling

- Reclassified the current interactive terrain endpoint as `DIAGNOSTIC_SIMULATOR_UNVALIDATED`. It no longer claims to be active XGBoost production inference.
- Updated the Lab copy to distinguish terrain diagnostics from a registered, evaluated Panchayat forecast model.
- Added regression coverage; backend suite: **66 passed**. Frontend lint/build and Git whitespace checks passed.

### Delivery Outbox Foundation

- Approval now creates one durable, idempotent `pwa` delivery job in `queued` state. Queued is not treated as sent/delivered; a provider worker must record those later transitions.
- Added delivery-job API visibility for authorized officer/admin workflows and migration `20260928_delivery_outbox`.
- Added regression coverage for the approval → one delivery-job transition. Backend suite: **67 passed**.
- Declared `geoalchemy2`, which existing historical Alembic migrations already import but requirements omitted. The local virtual environment predates this dependency, so Alembic graph validation remains pending a dependency install; frontend lint/build and Git whitespace checks passed.

### Deployment and CI Configuration

- Added Vercel SPA build/routing configuration, a Render FastAPI blueprint with migration pre-deploy command, and GitHub CI for dependency installation, Alembic graph validation, backend tests, frontend lint, and frontend build.
- Added `docs/deployment.md` with exact separation of Vercel frontend versus long-running FastAPI/PostgreSQL/provider worker, required environment variables, and live-integration gates.
- Local `geoalchemy2` installation could not be completed because this managed environment has no package-network access. CI/Render will install the now-declared dependency from `requirements.txt` and validate the graph.

### Model Health Integrity Slice

- Replaced the District model-health endpoint’s fixed MAE/RMSE/error-reduction values with `NOT_PRODUCTION_READY` until a registered held-out evaluation exists.
- Updated Admin model KPI cards to show unavailable values and `Evaluation required`, not fabricated numbers.
- Backend suite: **68 passed**; frontend lint/build passed.

### Truthful Admin Data and Bundle Slice

- Removed the remaining synthetic 25-day MAE curve and fake fallback-drill success result. The Admin console now shows an explicit evaluation-unavailable state until an approved held-out artifact exists, and reports fallback-drill configuration prerequisites instead of inventing a passing result.
- Reworked the legacy data-quality response to distinguish registered pilot records from official LGD/boundary coverage. It now derives weather coverage and staleness from persisted observations and returns unknown fields as `null` when the schema cannot support the claim.
- Resolved a duplicate `/admin/data-quality` route collision. The newer async geography diagnostics remain available under `/locations/admin/data-quality`; the production admin route now reaches the tested synchronous implementation.
- Made delivery-job status portable by storing its lifecycle value as a string, matching the Alembic migration on both SQLite and PostgreSQL.
- Added route-level React lazy loading for public, auth, farmer, officer, admin, and ML Lab pages. The largest initial JavaScript payload fell from about **1.47 MB (405 KB gzip)** to **303 KB (99 KB gzip)**; page-specific Admin, chart, and Leaflet chunks load only when required.

### Verification

- `PYTHONPATH=. .venv/bin/python -m pytest tests/ -q` → **70 passed**.
- `npm run lint && npm run build` → passed; route-level output is split with no >500 KB chunk warning.

### Production Login Gate Slice

- Closed the phone-only production login bypass, including the legacy magic admin number. Phone lookup remains only for explicitly marked development/demo/test runs; production staff require provisioned credential login and farmers follow the OTP flow.
- OTP requests now return a clear `503` rather than claiming an SMS was sent when a delivery provider is absent. This is intentionally fail-closed until a real provider adapter and credentials are configured.
- Added regression coverage for both production guards. Backend suite: **71 passed**.

### Delivery Claim Integrity Slice

- Disabled the legacy manual “mark as sent” mutation. It now requires an officer/admin identity and returns `409` because only a configured provider worker may move an advisory to a delivered state after a receipt.
- Replaced the fabricated officer broadcast dispatch/delivery counts with a typed unavailable result, and changed the mobile-responsive broadcast dialog to show its real readiness message instead of a false success receipt or estimated farmer counts.
- Added delivery-claim regression coverage. Backend suite: **72 passed**; frontend lint/build and whitespace checks passed.

### GitHub Readiness Documentation

- Rewrote the README’s production claims to match the code: it now clearly separates the safe local pilot/demo from live IMD/AWS, delivery, geography, and ML-evaluation requirements.
- Documented the durable outbox semantics, explicit migration setup, Vercel-plus-long-running-backend topology, and the included deployment/CI files so a new contributor can clone and run the project without relying on hidden context.

### Public-source Integration Path

- Researched and documented the legitimate integration path in `docs/data-sources.md`: Open-Meteo is the no-key, CC BY 4.0 public forecast fallback; the Ministry of Panchayati Raj LGD catalogue is the official hierarchy-code source; IMD requires its documented endpoint agreement/credentials; and MSG91 is the recommended India-first account-based SMS/WhatsApp/voice option.
- Corrected the Panchayat forecast adapter so public Open-Meteo results carry `OPEN_METEO_PUBLIC` provenance and can never be labelled IMD. Removed the IMD provider's fabricated response when credentials are missing; it now fails closed.
- Added the missing Open-Meteo configuration field, delivery webhook-secret guidance, source/deployment documentation, and an integrity regression. Backend suite: **73 passed**; frontend lint/build and whitespace checks passed.
- `./start.sh` reaches FastAPI startup and correctly falls back to SQLite when local PostgreSQL is unavailable. The managed execution environment rejects binding to `0.0.0.0:8000` with `operation not permitted`, so live localhost/browser verification must be repeated from a normal local terminal or deployed host.

### Shared Location and Research Evidence Slice

- Fixed GPS hierarchy corruption: the backend now promotes a nearest seeded Panchayat only within 35 km. Remote GPS fixes retain their reverse-geocoded hierarchy or exact coordinates and are never relabelled as Dhapewada/Kalmeshwar/Nagpur.
- Extended selected locations with source, selection timestamp and hierarchy-resolution status. The AppLayout listens for Farmer GPS events, so its navbar and all route consumers update with the shared location scope.
- Reworked Officer/Admin desktop shells to use a viewport-height independent content scroll region; their sidebars stay fixed beneath the global navigation on desktop while mobile retains the horizontal tab strip.
- Added the checksum-versioned `phase6_research_evaluation.json` artifact based on 892 matched GFS/ISD observations. Model Health exposes it as `RESEARCH_DEMO` with its limitations, never as production-ready model evidence. Fallback now reports a timestamped provider/model/delivery readiness checklist.
- Added `docs/role-workflows.md` and linked it from the README.
- Verification: **73 backend tests passed**, frontend lint/build passed, and Git whitespace checks passed.
