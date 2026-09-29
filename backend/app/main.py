"""MausamSetu FastAPI application entry point."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, advisories, weather, panchayats, chatbot, geography, field_reports, officers, nic, farmer_routes, admin, ml_showcase, officer_routes, locations, advice_engine
from app.config import settings

logger = logging.getLogger("mausamsetu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed foundational users on application startup
    try:
        from app.db.session import init_db_and_seed
        init_db_and_seed()
    except Exception as e:
        logger.warning(f"Startup DB initialization notice: {e}")
    yield


app = FastAPI(
    title="MausamSetu API",
    description="AI-assisted Panchayat-level agro-meteorological intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — Support local development, Vercel deployments (*.vercel.app), Render (*.onrender.com), and custom domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost(:\d+)?|http://127\.0\.0\.1(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers (Direct root paths)
app.include_router(auth.router)
app.include_router(geography.router)
app.include_router(geography.router, prefix="/locations")
app.include_router(locations.router)
app.include_router(panchayats.router)
app.include_router(weather.router)
app.include_router(weather.panchayat_weather_router)
app.include_router(advisories.router)
app.include_router(officers.router)
app.include_router(field_reports.router)
app.include_router(chatbot.router)
app.include_router(nic.router)
app.include_router(farmer_routes.router)
app.include_router(admin.router, prefix="/admin")
app.include_router(ml_showcase.router)
app.include_router(officer_routes.router, prefix="/officer-ops")
app.include_router(advice_engine.router)

# Routers (Prefixed with /api for frontend API client compatibility)
app.include_router(auth.router, prefix="/api")
app.include_router(geography.router, prefix="/api")
app.include_router(geography.router, prefix="/api/locations")
app.include_router(locations.router, prefix="/api")
app.include_router(panchayats.router, prefix="/api")
app.include_router(weather.router, prefix="/api")
app.include_router(weather.panchayat_weather_router, prefix="/api")
app.include_router(advisories.router, prefix="/api")
app.include_router(officers.router, prefix="/api")
app.include_router(field_reports.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(nic.router, prefix="/api")
app.include_router(farmer_routes.router, prefix="/api")
app.include_router(admin.router, prefix="/api/admin")
app.include_router(ml_showcase.router, prefix="/api")
app.include_router(officer_routes.router, prefix="/api/officer-ops")
app.include_router(advice_engine.router, prefix="/api")



@app.get("/", tags=["health"])
@app.get("/api", tags=["health"])
def root():
    return {
        "service": "MausamSetu API",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["health"])
@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
