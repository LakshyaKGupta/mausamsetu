"""Weather API router."""

from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Panchayat, WeatherObservation, WeatherSource
from app.schemas.schemas import WeatherOut, WeatherSummary
from app.ml.weather_downscaler import fetch_block_forecast, downscale_to_panchayat, make_mock_weather

router = APIRouter(prefix="/weather", tags=["weather"])


def _condition_from_weather(temp_max, rainfall_mm, humidity_pct) -> str:
    rain = rainfall_mm or 0
    temp = temp_max or 30
    hum = humidity_pct or 60
    if rain > 30:
        return "rainy"
    if rain > 8:
        return "partly_cloudy"
    if temp > 38:
        return "sunny"
    if hum > 75:
        return "cloudy"
    return "sunny"


@router.get("/{panchayat_id}/today", response_model=WeatherSummary)
async def get_today_weather(panchayat_id: int, db: Session = Depends(get_db)):
    """Get today's downscaled weather forecast for a panchayat."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    # Check if we already have today's observation
    today = date.today()
    existing = db.query(WeatherObservation).filter(
        WeatherObservation.panchayat_id == panchayat_id,
        WeatherObservation.observed_at >= datetime(today.year, today.month, today.day),
    ).first()

    if existing:
        return WeatherSummary(
            panchayat_id=panchayat.id,
            panchayat_name=panchayat.name,
            date=today.isoformat(),
            temperature_max=existing.temperature_max,
            temperature_min=existing.temperature_min,
            rainfall_mm=existing.rainfall_mm,
            humidity_pct=existing.humidity_pct,
            condition=_condition_from_weather(existing.temperature_max, existing.rainfall_mm, existing.humidity_pct),
            confidence_score=existing.confidence_score,
        )

    # Fetch fresh from OpenMeteo
    block = await fetch_block_forecast(panchayat.lat, panchayat.lng)

    if block:
        weather_input, confidence = downscale_to_panchayat(
            block,
            panchayat_lat=panchayat.lat,
            panchayat_lng=panchayat.lng,
            panchayat_elevation_m=panchayat.elevation_m,
        )
        source = WeatherSource.openmeteo
    else:
        # Fallback to mock
        weather_input, confidence = make_mock_weather(panchayat_id)
        source = WeatherSource.mock

    # Persist observation
    obs = WeatherObservation(
        panchayat_id=panchayat_id,
        observed_at=datetime.utcnow(),
        temperature_max=weather_input.temperature_max,
        temperature_min=weather_input.temperature_min,
        rainfall_mm=weather_input.rainfall_mm,
        humidity_pct=weather_input.humidity_pct,
        wind_speed_kmh=weather_input.wind_speed_kmh,
        cloud_cover_pct=weather_input.cloud_cover_pct,
        source=source,
        confidence_score=confidence,
    )
    db.add(obs)
    db.commit()

    return WeatherSummary(
        panchayat_id=panchayat.id,
        panchayat_name=panchayat.name,
        date=today.isoformat(),
        temperature_max=weather_input.temperature_max,
        temperature_min=weather_input.temperature_min,
        rainfall_mm=weather_input.rainfall_mm,
        humidity_pct=weather_input.humidity_pct,
        condition=_condition_from_weather(weather_input.temperature_max, weather_input.rainfall_mm, weather_input.humidity_pct),
        confidence_score=confidence,
    )


@router.get("/{panchayat_id}/history", response_model=list[WeatherOut])
def get_weather_history(panchayat_id: int, days: int = 7, db: Session = Depends(get_db)):
    """Get recent weather history for a panchayat."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    observations = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.panchayat_id == panchayat_id)
        .order_by(WeatherObservation.observed_at.desc())
        .limit(days)
        .all()
    )
    return observations
