# MausamSetu 🌾🌦

> **India-Ready Weather-to-Agricultural Intelligence Platform**  
> Hyperlocal, panchayat-level agrometeorological decision support combining downscaled weather models, crop-stage agronomic rules, and verified human-in-the-loop review.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Installable_%26_Offline_Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Pytest](https://img.shields.io/badge/Tests-13%20Passed-brightgreen?style=flat-square&logo=pytest)](https://pytest.org)

---

## What is MausamSetu?

Most weather applications show raw forecasts (temperatures, millimeter rainfall, humidity) at coarse 15–40 km grids. Farmers do not farm at 40 km resolution, nor do raw millimeters translate directly into agricultural actions.

**MausamSetu** bridges this gap:
1. Ingests official IMD data and local ground Automatic Weather Stations (AWS).
2. Spatially downscales forecasts to panchayat terrain and microclimate.
3. Evaluates crop vulnerabilities using stage-based agronomic rule engines.
4. Generates structured draft advisories for mandatory Agricultural Extension Officer verification.
5. Delivers simple, voice-first, verified agricultural guidance to farmers via a downloadable PWA that works offline.

---

## Core Decision Pipeline

```
Regional Weather Data (IMD / AWS Stations)
               │
               ▼
     Spatial Downscaling Engine
   (Elevation, Distance, Terrain)
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
       Published Advisory
               │
               ▼
      Farmer Action & Voice
  (PWA, Offline Caching, Mic Q&A)
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
| **🏛 District Admin** | Oversee district telemetry, officer workload, and model reliability | Operations command center, 9 tabs, officer reassignment, data health, fallback engine, system audit log |

---

## India-First Geographic Architecture

MausamSetu is designed from day one with configuration-driven multi-state geography. **Nagpur District (Maharashtra)** serves as the calibrated pilot deployment, while the underlying architecture supports any Indian state or district without code changes.

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
- **Machine Learning**: XGBoost downscaler · Topographic feature extractors · Calibrated prediction intervals
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

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Backend API docs will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Demo Credentials & Access

The login screen provides a unified phone OTP login alongside one-click **Hackathon Demo Access** cards:

| Role | Name / Scope | Phone | Access Link |
|---|---|---|---|
| **Farmer** | Ramesh Patil (Dhapewada GP) | `9876543200` | `/app/farmer` |
| **Extension Officer** | Rajesh Sharma (Kalmeshwar Block) | `9876543210` | `/app/officer` |
| **District Admin** | Nagpur Operations Desk | `9876543299` | `/app/admin` |

---

## Live State Machine & Data Harmonization

MausamSetu avoids disconnected mock data by linking all three interfaces to a shared database state:

- **Nagpur District Base**: 78 Gram Panchayats across 4 blocks $\rightarrow$ **71 Approved**, **7 Pending Review**.
- **Kalmeshwar Block Base**: 24 Gram Panchayats $\rightarrow$ **22 Approved**, **2 Pending Review**.
- **State Synchronization**:
  1. Officer Rajesh Sharma approves advisory `#MS-1042` in Kalmeshwar.
  2. Kalmeshwar pending count immediately drops from **2 to 1** (approved rises to **23**).
  3. District Admin pending count simultaneously drops from **7 to 6** (approved rises to **72**).
  4. The Farmer endpoint immediately serves `#MS-1042` with the officer verification badge.

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
  - Unified OTP login, progressive farmer onboarding, demo sessions, and telemetry health.

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

---

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
