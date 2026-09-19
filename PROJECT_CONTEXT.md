# MausamSetu — Project Context

## What This Is

MausamSetu is an AI-assisted Panchayat-level agro-meteorological intelligence platform
built for Indian farmers. It downscales block-level weather forecasts to Panchayat
granularity and converts them into crop-specific agricultural advisories in Hindi,
Marathi, and English. Officers review AI-generated advisories before farmers receive them.

## Owner

Lakshya K. Gupta — builder, operator, startup founder.
Context: `/Users/lol/Docs/instructions.ai/LAKSHYA_CONTEXT.md`

## Core Pipeline

```
IMD / OpenMeteo Block Forecast
         ↓
ML Downscaling (panchayat-level correction)
         ↓
AI Advisory Generator (rule-based, multilingual templates)
         ↓ status: pending
Officer Review Dashboard (approve / modify / reject)
         ↓ status: approved
Farmer PWA (multilingual, voice-first, offline-capable)
         ↓ status: sent
```

## Business Context

- Target geography: Nagpur district, Maharashtra (MVP)
- Target users: ~50 Panchayats, government agricultural officers, farmers
- Primary problem: IMD forecasts are block-level (~40 km²); farmers need Panchayat-level (~5 km²) actionable data
- Advisory language: Hindi (primary), Marathi (secondary), English (fallback)
- Key constraint: No LLM for advisory text (hallucination risk on crop data)

## Technical Stack

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + Python 3.12 + SQLAlchemy
- Database: PostgreSQL
- ML: Rule-based advisory engine (template × weather condition)
- Voice: Web Speech API (browser-native, no paid infra)
- Maps: Leaflet + OpenStreetMap

## Current State

**Phase 1–4 COMPLETE** (built in initial session):
- Full project scaffold
- Database schema (7 tables)
- FastAPI backend with all routes
- ML advisory generator (rule-based, 4 crops, 6 conditions, 3 languages)
- Weather downscaling (OpenMeteo + mock fallback)
- Officer Review Dashboard (React)
- Advisory Detail Modal with approve/modify/reject
- Farmer PWA home (weather card, advisories, voice chatbot)
- Officer login (OTP-based)
- Mock data seeder (50 panchayats, 200 farmers, advisories)
- Docker Compose setup
- README

**Remaining:**
- Start PostgreSQL and run seeder
- npm install + vite dev server test
- Phase 5: Map view (Leaflet choropleth)
- Phase 6: PWA offline (Workbox service worker)
- Phase 7: SMS/WhatsApp advisory delivery
- Phase 8: XGBoost-based downscaling (replace rule-based)
- Real IMD API integration

## Key Files

| File | Purpose |
|------|---------|
| `backend/app/ml/advisory_generator.py` | Core ML advisory logic |
| `backend/app/ml/weather_downscaler.py` | Weather correction + OpenMeteo fetch |
| `backend/app/api/advisories.py` | Advisory workflow routes |
| `backend/app/utils/seeder.py` | Mock data (run to populate DB) |
| `frontend/src/pages/officer/Dashboard.tsx` | Officer review queue |
| `frontend/src/components/officer/AdvisoryDetailModal.tsx` | Approve/modify modal |
| `frontend/src/pages/farmer/Home.tsx` | Farmer PWA with chatbot |

## Dev Credentials (seeded)

Officer phone numbers for OTP login: 9876543210, 9876543211, 9876543212
In dev mode, OTP appears in API response and on login screen.
