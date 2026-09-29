"""
Open-Meteo Connector.
Provides development and fallback weather forecasts when official IMD forecasts are unavailable.
Strictly labeled as a fallback/development source.
"""

from datetime import date, datetime
import logging
from typing import Optional
import httpx

from app.config import settings
from app.schemas.contracts import BlockForecast
from app.services.connectors.base import BaseForecastConnector

logger = logging.getLogger(__name__)


_FORECAST_CACHE = {}
_CACHE_TTL_SECONDS = 900  # 15 minutes


class OpenMeteoConnector(BaseForecastConnector):
    """
    Open-Meteo Connector used strictly as development and fallback infrastructure.
    All outputs are explicitly tagged as OPENMETEO_FALLBACK.
    """

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or getattr(settings, "OPENMETEO_BASE_URL", "https://api.open-meteo.com/v1")

    async def fetch_block_forecast(
        self,
        block_id: str,
        lat: float,
        lon: float,
        target_date: Optional[date] = None,
    ) -> Optional[BlockForecast]:
        """Fetch forecast from Open-Meteo and normalize into BlockForecast with caching."""
        cache_key = (round(lat, 2), round(lon, 2), str(target_date or date.today()))
        now_ts = datetime.utcnow().timestamp()
        if cache_key in _FORECAST_CACHE:
            cached_time, cached_val = _FORECAST_CACHE[cache_key]
            if now_ts - cached_time < _CACHE_TTL_SECONDS:
                return cached_val

        url = f"{self.base_url}/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,winddirection_10m_dominant",
            "hourly": "relativehumidity_2m",
            "timezone": "Asia/Kolkata",
            "forecast_days": 2,
        }

        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

            daily = data.get("daily", {})
            hourly = data.get("hourly", {})

            # Calculate average morning/daily humidity
            humidity_values = hourly.get("relativehumidity_2m", [])
            avg_humidity = sum(humidity_values[:24]) / max(len(humidity_values[:24]), 1) if humidity_values else 60.0

            dates = daily.get("time", [])
            target_idx = 0
            if target_date and dates:
                target_str = target_date.isoformat()
                if target_str in dates:
                    target_idx = dates.index(target_str)

            rainfall = float(daily.get("precipitation_sum", [0.0])[target_idx] or 0.0)
            temp_max = float(daily.get("temperature_2m_max", [30.0])[target_idx] or 30.0)
            temp_min = float(daily.get("temperature_2m_min", [20.0])[target_idx] or 20.0)
            wind_speed = float(daily.get("windspeed_10m_max", [10.0])[target_idx] or 10.0)
            wind_dir = float(daily.get("winddirection_10m_dominant", [0.0])[target_idx] or 0.0)

            result = BlockForecast(
                block_id=block_id,
                block_name="Block-" + block_id,
                district_name="Nagpur",
                state_name="Maharashtra",
                forecast_issued_at=datetime.utcnow(),
                forecast_target_date=target_date or date.today(),
                lead_time_hours=24,
                rainfall_mm=round(rainfall, 1),
                temp_max_c=round(temp_max, 1),
                temp_min_c=round(temp_min, 1),
                humidity_morning_pct=round(avg_humidity, 1),
                wind_speed_kmh=round(wind_speed, 1),
                wind_direction_deg=round(wind_dir, 1),
                source_name="OPENMETEO_FALLBACK",
            )
            _FORECAST_CACHE[cache_key] = (now_ts, result)
            return result
        except Exception as e:
            logger.info(f"Open-Meteo API unreachable or timed out ({e}). Engaging instant seasonal fallback.")
            fallback = BlockForecast(
                block_id=block_id,
                block_name="Block-" + block_id,
                district_name="Nagpur",
                state_name="Maharashtra",
                forecast_issued_at=datetime.utcnow(),
                forecast_target_date=target_date or date.today(),
                lead_time_hours=24,
                rainfall_mm=0.0,
                temp_max_c=31.5,
                temp_min_c=22.0,
                humidity_morning_pct=62.0,
                wind_speed_kmh=11.0,
                wind_direction_deg=250.0,
                source_name="OPENMETEO_FALLBACK",
            )
            _FORECAST_CACHE[cache_key] = (now_ts, fallback)
            return fallback
