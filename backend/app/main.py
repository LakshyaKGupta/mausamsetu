"""MausamSetu FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, advisories, weather, panchayats, chatbot
from app.config import settings
from app.db.session import Base, engine

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MausamSetu API",
    description="AI-assisted Panchayat-level agro-meteorological intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(panchayats.router)
app.include_router(weather.router)
app.include_router(advisories.router)
app.include_router(chatbot.router)


@app.get("/", tags=["health"])
def root():
    return {
        "service": "MausamSetu API",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
