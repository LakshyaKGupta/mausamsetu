# MausamSetu 🌾🌦

> **Panchayat-level agro-meteorological decision-support platform**
> A safety-first MoES/IMD problem-statement implementation: coarse forecast ingestion, terrain-aware localisation, agronomic draft advisories, mandatory extension-officer review, and farmer-facing mobile guidance.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Installable_%26_Offline_Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-72%20passed-brightgreen?style=flat-square&logo=pytest)](https://pytest.org)

---

## What is MausamSetu?

Most weather applications show raw forecasts (temperatures, millimeter rainfall, humidity) at coarse 15–40 km grids. Farmers do not farm at 40 km resolution, nor do raw millimeters translate directly into agricultural actions.

**MausamSetu** is structured to bridge this gap:
1. Accepts provider forecasts and station observations with source/time provenance.
2. Localises forecasts using terrain-aware diagnostics, pending registration of a validated downscaling model.
3. Applies crop-stage agronomic rules to generate a reviewable draft.
4. Requires Agricultural Extension Officer approval or modification before publication.
5. Presents simple, voice-friendly guidance in a mobile PWA.

### Current integration status

The repository is safe to demo locally, but it is **not yet a live IMD/AWS or SMS/WhatsApp/IVR deployment**. Open-Meteo is the current clearly attributed public forecast fallback; unconfigured providers, delivery channels, benchmark metrics, and fallback drills report explicit unavailable states. A production rollout requires approved IMD/AWS access, a delivery-provider contract and webhook credentials, an evaluated model artifact, official LGD/boundary imports, and deployment secrets. See [data-source setup](docs/data-sources.md), [the deployment guide](docs/deployment.md), and [implementation audit](docs/audits/2026-09-28-implementation-map.md).

See [role workflows](docs/role-workflows.md) for the Farmer, Officer and Admin user journeys, location-sync rules, research-model labels and delivery semantics.

---

## Core Decision Pipeline

```
Verified provider forecast / station observation
               │
               ▼
  Registered & evaluated downscaling model
     (terrain and uncertainty metadata)
               │
               ▼
   Panchayat Weather Intelligence
               │
               ▼
    Crop & Growth Stage Context
  (Sowing, Vegetative, Flowering...)
               │
               ▼
      Agronomic Rule Engine
  (Threshold-driven decision logic)
               │
               ▼
          Draft Advisory
               │
               ▼
   Agricultural Officer Review
   (Approve / Modify / Reject)
               │
               ▼
       Approved Advisory + durable outbox job
               │
               ▼
      Farmer Action & Voice
      (PWA + explicit freshness)
               │
               ▼
     Field Observation Loop
   (Ground telemetry & reports)
```

---

## Three Dedicated Roles

| Role | Primary Purpose | Interface Focus |
|---|---|---|
| **🌾 Farmer** | Understand today's weather and take validated agricultural action | Simple, jargon-free 3-question layout, speech assistant, offline caching, Hindi/Marathi/English |
| **🧑‍🌾 Agricultural Extension Officer** | Review, calibrate, and sign off on advisories using local evidence | Operations console, 8 subviews, topographic diff tables, prediction intervals, field reports, block maps |
| **🏛 District Admin** | Oversee coverage, officer workload, model readiness, and provenance | Operations command center, provisioning, data health, evaluation readiness, audit log |

---

## India-First Geographic Architecture

MausamSetu has a pilot-oriented hierarchy. **Nagpur District (Maharashtra)** is the current seed/demo geography. India-wide coverage is not claimed until official LGD/boundary data is imported and quality-checked.

```
India
 └── State (e.g., Maharashtra, Punjab, Karnataka)
      └── District (e.g., Nagpur, Ludhiana, Mandya)
           └── Block / Taluka (e.g., Kalmeshwar, Hingna, Saoner, Katol)
                └── Gram Panchayat (e.g., Dhapewada, Selo, Ubali)
                     └── Village
                          └── Farmer Profile
                               └── Farm Plot
                                    └── Crop & Dynamic Stage
```

### Pre-configured State Profiles
- **Maharashtra (`MH`)**: Marathi, Hindi, English · Soybean, Cotton, Wheat, Chickpea, Mandarin Orange
- **Punjab (`PB`)**: Punjabi, Hindi, English · Wheat, Basmati Rice, Maize, Cotton
- **Karnataka (`KA`)**: Kannada, Hindi, English · Finger Millet (Ragi), Rice, Maize, Sugarcane

---

## Mobile App & PWA Support

MausamSetu functions as a native-feeling Progressive Web App:
- **Home Screen Installation**: Installable directly on Android (via Chromium prompt) and iOS (via Safari Share $\rightarrow$ Add to Home Screen).
- **Service Worker (`sw.js`)**: Caches static shell assets and stores the latest verified advisory and weather forecast locally.
- **Offline Reliability**: When farmers are in low-connectivity fields, the app automatically serves the last verified advisory with clear freshness timestamps rather than failing.
- **Responsive Layout**: Designed mobile-first with touch-friendly controls ($\ge 48\text{px}$ touch targets), safe-area insets, and sticky bottom navigation.

---

## Tech Stack

- **Backend**: Python 3.12+ · FastAPI · SQLAlchemy · Pydantic v2 · SQLite / PostgreSQL
- **Machine Learning**: terrain-aware diagnostic prototype · evaluation-artifact gate · model-registration design
- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · Lucide Icons · Leaflet Maps
- **PWA & Offline**: Web App Manifest · Service Worker Cache API · Web Speech API
- **Testing**: Pytest · HTTPX · In-memory SQLite with StaticPool

---

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/LakshyaKGupta/mausamsetu.git
cd mausamsetu
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies and apply schema migrations
pip install -r requirements.txt
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend API docs will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install pinned packages
npm ci

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Local demo access

Development mode supports isolated demo identities. Never enable demo mode or use these values in a hosted environment; production phone login is disabled until a real OTP provider is configured.

| Role | Name / Scope | Phone | Access Link |
|---|---|---|---|
| **Farmer** | Ramesh Patil (Dhapewada GP) | `9876543200` | `/app/farmer` |
| **Extension Officer** | Rajesh Sharma (Kalmeshwar Block) | `9876543210` | `/app/officer` |
| **District Admin** | Nagpur Operations Desk | `9876543299` | `/app/admin` |

---

## Advisory state and delivery semantics

Approval is persisted and creates one idempotent `queued` delivery-outbox job. `queued` is not equivalent to sent or delivered: a provider worker must record an accepted/delivered receipt. This prevents the interface from claiming a delivery that has not happened.

---

## Testing & Quality Assurance

Run the automated backend test suite:
```bash
PYTHONPATH=backend pytest backend/tests/ -v
```

The test suite covers:
- **Role-Based Access Control**:
  - `test_rbac_farmer_cannot_review_advisory` (ensures `403 Forbidden` on farmer review attempts)
  - `test_rbac_officer_cannot_review_cross_block` (ensures `403 Forbidden` on cross-block actions)
  - `test_rbac_district_admin_access` (ensures `403 Forbidden` on foreign district access)
- **Synchronized State Mutation**:
  - `test_state_machine_mutation_synchronization` (proves simultaneous multi-role count updates)
- **Workflow & Auth**:
  - Development demo sessions and production guards for phone-only login and unconfigured OTP delivery.
- **Data integrity**:
  - Unconfigured IMD/AWS/delivery provider states, unavailable model metrics, no fabricated benchmark curve, delivery outbox idempotency, and no manual fabricated delivery receipts.

To verify the frontend production build:
```bash
cd frontend
npm run build
```

---

## Project Structure

```
mausamsetu/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI endpoints (auth, geography, advisories, weather, officers, field reports)
│   │   ├── models/          # Database models (User, Panchayat, Advisory, FieldReport, Crop)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── ml/              # Weather downscaler & rule-based advisory engine
│   │   └── utils/           # Seeder & data initialization
│   ├── tests/               # Pytest automated test suite
│   ├── alembic/              # Explicit schema migrations
│   └── requirements.txt
├── frontend/
│   ├── public/              # PWA manifest, service worker, app icons
│   ├── src/
│   │   ├── pages/
│   │   │   ├── app/         # Farmer, Officer, and Admin operational consoles
│   │   │   ├── auth/        # Login, Signup, OTP Verification
│   │   │   └── landing/     # Public product overview & methodology
│   │   ├── components/      # UI components (PWA banner, modals, cards, maps)
│   │   ├── api/             # Typed Axios client with role headers
│   │   └── types/           # Core domain interfaces
│   └── vite.config.ts
└── README.md
```

## Deployment

Deploy the React SPA on Vercel and the FastAPI API, PostgreSQL database, and provider/delivery worker on a long-running platform such as Render. `vercel.json`, `render.yaml`, and the CI workflow are included; configure secrets in the host dashboard, never in Git. Follow [docs/deployment.md](docs/deployment.md) before publishing.

---

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
