"""
Weather downscaling service.

Takes block-level forecast (from OpenMeteo free API) and adjusts it for
a specific panchayat using elevation bias correction and historical offsets.

For MVP: rule-based bias correction. Production: XGBoost regression.
"""

import httpx
from dataclasses import dataclass
from typing import Optional

from app.config import settings
from app.ml.advisory_generator import WeatherInput


@dataclass
class BlockForecast:
    """Raw block-level forecast from OpenMeteo."""
    lat: float
    lng: float
    temperature_max: float
    temperature_min: float
    rainfall_mm: float
    humidity_pct: float
    wind_speed_kmh: float
    cloud_cover_pct: float


async def fetch_block_forecast(lat: float, lng: float) -> Optional[BlockForecast]:
    """
    Fetch today's forecast from OpenMeteo free API.
    Returns None on failure (graceful degradation).
    """
    url = f"{settings.OPENMETEO_BASE_URL}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max",
        "hourly": "relativehumidity_2m,cloudcover",
        "timezone": "Asia/Kolkata",
        "forecast_days": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        hourly = data.get("hourly", {})

        # Average hourly humidity for the day
        humidity_values = hourly.get("relativehumidity_2m", [])
        avg_humidity = sum(humidity_values) / len(humidity_values) if humidity_values else 60.0

        cloud_values = hourly.get("cloudcover", [])
        avg_cloud = sum(cloud_values) / len(cloud_values) if cloud_values else 30.0

        return BlockForecast(
            lat=lat,
            lng=lng,
            temperature_max=daily.get("temperature_2m_max", [30.0])[0] or 30.0,
            temperature_min=daily.get("temperature_2m_min", [20.0])[0] or 20.0,
            rainfall_mm=daily.get("precipitation_sum", [0.0])[0] or 0.0,
            humidity_pct=avg_humidity,
            wind_speed_kmh=daily.get("windspeed_10m_max", [10.0])[0] or 10.0,
            cloud_cover_pct=avg_cloud,
        )
    except Exception:
        return None


def downscale_to_panchayat(
    block: BlockForecast,
    panchayat_lat: float,
    panchayat_lng: float,
    panchayat_elevation_m: Optional[float] = None,
    block_elevation_m: Optional[float] = 300.0,
) -> tuple[WeatherInput, float]:
    """
    Apply panchayat-level corrections to block forecast.

    Returns: (WeatherInput, confidence_score)

    Corrections applied:
    - Elevation lapse rate: -0.65°C per 100m altitude gain
    - Geographic offset: small ±bias based on lat/lng delta from block centroid
    """
    lat_delta = abs(panchayat_lat - block.lat)
    lng_delta = abs(panchayat_lng - block.lng)
    distance_proxy = (lat_delta ** 2 + lng_delta ** 2) ** 0.5

    # Confidence degrades as panchayat moves further from block centroid
    # At 0.5° delta (~55 km), confidence reaches ~0.65
    confidence = max(0.50, 0.95 - distance_proxy * 0.60)

    # Elevation-based temperature correction
    elevation_delta = (panchayat_elevation_m or block_elevation_m) - block_elevation_m
    lapse_correction = elevation_delta * 0.0065  # 0.65°C per 100m

    temp_max = block.temperature_max - lapse_correction
    temp_min = block.temperature_min - lapse_correction

    # Rainfall: slight correction based on elevation (orographic)
    rainfall_factor = 1.0 + (elevation_delta / 1000.0) * 0.15
    rainfall_mm = max(0, block.rainfall_mm * rainfall_factor)

    return (
        WeatherInput(
            temperature_max=round(temp_max, 1),
            temperature_min=round(temp_min, 1),
            rainfall_mm=round(rainfall_mm, 1),
            humidity_pct=round(block.humidity_pct, 1),
            wind_speed_kmh=round(block.wind_speed_kmh, 1),
            cloud_cover_pct=round(block.cloud_cover_pct, 1),
        ),
        round(confidence, 3),
    )


def make_mock_weather(panchayat_id: int) -> tuple[WeatherInput, float]:
    """
    Deterministic mock weather generator for dev/testing.
    Produces varied but realistic weather based on panchayat_id.
    """
    base = panchayat_id % 6
    scenarios = [
        WeatherInput(35.5, 24.0, 42.0, 85.0, 12.0, 90.0),   # rain_heavy
        WeatherInput(29.0, 20.0, 18.0, 72.0, 8.0, 55.0),    # rain_moderate
        WeatherInput(41.0, 28.0, 0.0, 30.0, 15.0, 10.0),    # dry_hot
        WeatherInput(28.0, 18.0, 2.0, 45.0, 10.0, 20.0),    # dry_mild
        WeatherInput(31.0, 22.0, 3.0, 80.0, 6.0, 65.0),     # humid_mild
        WeatherInput(30.0, 21.0, 8.0, 65.0, 10.0, 40.0),    # optimal
    ]
    confidences = [0.88, 0.85, 0.87, 0.84, 0.82, 0.91]
    return scenarios[base], confidences[base]
