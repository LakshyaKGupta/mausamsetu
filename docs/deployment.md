# Deployment: Vercel frontend + Render API

MausamSetu is split deliberately: Vercel hosts the static React PWA and Render hosts FastAPI, the scheduled delivery worker, and PostgreSQL connectivity. Do not deploy the API to Vercel as a long-running service.

## 1. Deploy the API

1. Create a managed PostgreSQL database and a Render web service from `render.yaml`.
2. Set `DATABASE_URL`, `CORS_ORIGINS` (the exact Vercel HTTPS origin), and provider secrets in Render. Never set `VITE_*` secrets.
3. Render runs `alembic upgrade head` before deploying the API. A deployment must fail if migrations fail.
4. Keep `IMD_API_KEY`, `DELIVERY_API_KEY`, and `MODEL_EVALUATION_PATH` empty until each integration is validated. The API will report `NOT CONNECTED`/`NOT_PRODUCTION_READY`, which is intentional.

## 2. Deploy the PWA

1. Import the repository in Vercel. The root `vercel.json` builds `frontend` and supplies SPA rewrites.
2. Add `VITE_API_URL=https://<your-render-service>.onrender.com` in Vercel project environment variables.
3. Set `VITE_DEMO_MODE=false` in production. Demo headers must never be enabled on a public deployment.
4. Add the Vercel domain to Render `CORS_ORIGINS`, redeploy both services, then verify `/health` and a logged-in workflow.

## 3. Required live-integration gates

- IMD: approved endpoint contract, credential, normalized response test, issuance/validity timestamps.
- AWS/ARG: station/gateway contract, freshness threshold, source IDs, monitoring.
- Delivery: sender identity, provider credentials, approved templates, webhook signature secret, consent text, and a running delivery worker.
- ML: checksum-verified artifact and versioned held-out evaluation meeting the documented baseline/reliability gate.

Until those inputs exist, the system is deployable as a controlled pilot/demo but must not be described as a live IMD/AWS/delivery deployment.

## 4. Public-source pilot path

For a no-key controlled pilot, use Open-Meteo with visible CC BY 4.0 attribution
and retain its provider/freshness metadata. Import hierarchy codes from the
official LGD catalogue on data.gov.in, with a reviewed import record. Do not
call either source an IMD feed. For the exact setup and delivery prerequisites,
see [data-sources.md](data-sources.md).
