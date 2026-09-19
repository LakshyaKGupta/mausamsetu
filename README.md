# MausamSetu 🌦

**AI-assisted Panchayat-level agro-meteorological intelligence platform**

> Block-level weather → ML downscaling → AI advisory → Officer review → Farmer delivery

---

## Architecture

```
Block Weather (OpenMeteo/IMD)
      ↓
ML Downscaling (XGBoost / rule-based)
      ↓
AI Advisory Generator (template-driven, multilingual)
      ↓
Officer Review Dashboard (approve / modify / reject)
      ↓
Farmer PWA (Hindi / Marathi / English, voice-first, offline-capable)
```

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python 3.12 |
| ML | Rule-based advisory engine (XGBoost-ready) |
| Database | PostgreSQL |
| Maps | Leaflet + OpenStreetMap |
| Voice | Web Speech API (browser-native) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16+ (or Docker)

### Option A: Docker (recommended)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL at `localhost:5432`
- FastAPI at `http://localhost:8000`
- React dev server at `http://localhost:5173`

### Option B: Manual

#### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set up PostgreSQL and update .env
cp .env.example .env   # edit DATABASE_URL

# Start server
uvicorn app.main:app --reload

# Seed mock data (in a new terminal)
source .venv/bin/activate && python -m app.utils.seeder
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Farmer PWA |
| `http://localhost:5173/officer/login` | Officer login |
| `http://localhost:5173/officer` | Officer review dashboard |
| `http://localhost:8000/docs` | FastAPI Swagger UI |

---

## Demo Officer Accounts (seeded)

| Name | Phone | OTP (dev mode) |
|------|-------|----------------|
| Rajesh Sharma | 9876543210 | Shown in response |
| Priya Desai | 9876543211 | Shown in response |
| Anil Wankhede | 9876543212 | Shown in response |

> In dev mode, the OTP is returned in the API response and shown on the login screen.

---

## API Quick Reference

```bash
# Generate advisory
POST /advisories/generate
{ "panchayat_id": 1, "crop": "wheat" }

# List pending advisories
GET /advisories/?status=pending

# Officer approve
PATCH /advisories/1/review?officer_id=1
{ "action": "approved", "note": "Looks correct" }

# Farmer-facing advisories
GET /advisories/panchayat/1/approved

# Today's weather
GET /weather/1/today

# Chatbot
POST /chatbot/message
{ "message": "आज का मौसम?", "language": "hi", "panchayat_id": 1 }
```

---

## ML Advisory Engine

The advisory generator is **template-driven** (no LLM hallucination):

1. Weather inputs → condition classifier → one of 6 conditions:
   - `rain_heavy`, `rain_moderate`, `dry_hot`, `dry_mild`, `humid_mild`, `optimal`

2. Condition × crop → multilingual advisory text (Hindi / Marathi / English)

3. Confidence score:
   - ≥ 85%: High (approve with one click)
   - 60–84%: Medium (review before approving)
   - < 60%: Low (IMD fallback served)

Crops covered: wheat, cotton, soybean, rice (+ generic fallback for others)

---

## Project Structure

```
mausamsetu/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI routers
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── ml/            # Advisory generator + weather downscaler
│   │   └── utils/         # Seeder
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── farmer/    # Farmer PWA
│       │   ├── officer/   # Officer dashboard
│       │   └── auth/      # Login
│       ├── components/    # Shared components
│       ├── api/           # Typed API client
│       ├── lib/           # Utils
│       └── types/         # TypeScript types
├── ml/                    # ML notebooks (future XGBoost training)
└── docker-compose.yml
```
