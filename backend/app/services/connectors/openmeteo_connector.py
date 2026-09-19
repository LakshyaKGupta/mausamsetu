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
        """Fetch forecast from Open-Meteo and normalize into BlockForecast."""
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
            async with httpx.AsyncClient(timeout=10.0) as client:
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

            return BlockForecast(
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
        except Exception as e:
            logger.error(f"Error fetching from OpenMeteo: {e}")
            return None
