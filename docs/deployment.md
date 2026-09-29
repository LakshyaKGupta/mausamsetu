# Deployment Guide: Vercel Frontend + Render API

MausamSetu is architected for split-tier production deployment:
- **Frontend (PWA)**: Hosted on **Vercel** (`https://<your-app>.vercel.app`)
- **Backend (FastAPI)**: Hosted on **Render** (`https://<your-service>.onrender.com`)

---

## 1. Deploy the Backend to Render

### Option A: Using Render Blueprint (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Blueprint**.
2. Connect your GitHub repository `LakshyaKGupta/mausamsetu`.
3. Render will read `render.yaml`:
   - **Service Name**: `mausamsetu-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3.12.8`
   - **Build Command**: `pip install -r requirements.txt`
   - **Pre-deploy Command**: `python scripts/render_predeploy.py` (auto-applies migrations if Postgres is linked)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
4. Click **Apply**.

### Option B: Manual Web Service on Render
If creating a Web Service manually:
- **Language**: Python 3
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.12.8`
  - `ENVIRONMENT`: `production`
  - `CORS_ORIGINS`: `https://mausamsetu.vercel.app,https://*.vercel.app,http://localhost:5173`
  - `DATABASE_URL`: (Optional) Connection string to Render PostgreSQL. If omitted, embedded SQLite is used with auto-seeding.

> **Database Resilience**: Render connection strings starting with `postgres://` are automatically normalized to `postgresql://`. If no external database is attached or while PostgreSQL is provisioning, the server automatically starts with SQLite fallback so the service never crashes. Default demo accounts (`MS-ADMIN-NGP-001 / admin123`, `MS-OFFICER-001 / officer123`, `9812345678 / farmer123`) and initial Panchayats are seeded automatically.

---

## 2. Deploy the Frontend to Vercel

1. In the [Vercel Dashboard](https://vercel.com/dashboard), import your repository `mausamsetu`.
2. **Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as root; `vercel.json` will build `frontend`)
3. **Environment Variables**:
   - Add `VITE_API_URL`: `https://<your-render-service>.onrender.com`
   - (Optional) `VITE_DEMO_MODE`: `true` (if testing demo roles) or `false` (for strict token auth).
4. Click **Deploy**.

---

## 3. How Frontend Connects to Render

MausamSetu includes a 3-layer resilient connection architecture:

1. **Vite Build Variable**: Uses `VITE_API_URL` if configured in Vercel.
2. **Smart Remote Fallback**: If `VITE_API_URL` was omitted or set to localhost, the frontend automatically points to `https://mausamsetu-api.onrender.com`.
3. **Runtime URL Switcher & Cold-Start Indicator**:
   - Render's free tier spins down after 15 minutes of inactivity. When a visitor opens the app, a floating status badge shows:
     `Render backend waking up (~30s)...`
   - Axios requests wait up to **45 seconds** before timing out, ensuring seamless cold starts without broken screens.
   - Anyone can test with a custom Render backend by clicking the status badge or adding `?api_url=https://your-custom-backend.onrender.com` to the URL.
4. **Vercel API Proxy**: `vercel.json` includes an edge rewrite routing `/api/(.*)` to Render as an additional CORS-free path.

---

## 4. Verification Checklist

- [ ] Visit `https://<your-render-service>.onrender.com/health` → responds with `{"status": "ok"}`.
- [ ] Visit `https://<your-render-service>.onrender.com/docs` → displays interactive Swagger UI.
- [ ] Visit `https://<your-app>.vercel.app` → check that the bottom-right backend indicator displays **Connected** with latency.
- [ ] Test Login:
  - Admin: `MS-ADMIN-NGP-001` / `admin123`
  - Extension Officer: `MS-OFFICER-001` / `officer123`
  - Farmer: Enter phone `9812345678` → verify OTP `123456`
