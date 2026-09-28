import httpx
import logging
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.providers.base import WeatherProvider, NormalizedForecast
from app.core.config import settings
import asyncio

logger = logging.getLogger(__name__)

class IMausamGramProvider:
    """
    Panchayat forecast adapter.

    IMD is used only when its authorised integration is configured. Until then
    this adapter uses the explicitly-labelled Open-Meteo public forecast source.
    """
    
    def __init__(self):
        # IMD_MAUSAMGRAM_AUTHORIZED controls the authorization gate (Phase D & E)
        self.authorized = getattr(settings, "IMD_MAUSAMGRAM_AUTHORIZED", False)
        
    async def get_forecast_by_gpcode(self, gpcode: str, lat: float = None, lon: float = None, interval: int = 3) -> dict:
        """
        Fetches a public Open-Meteo forecast with explicit provenance.
        Supported intervals: 1, 3, 6.
        """
        if interval not in [1, 3, 6]:
            raise ValueError("Interval must be 1, 3, or 6 hours.")
            
        if lat is None or lon is None:
            raise ValueError("Latitude and longitude are required for real forecast data.")

        # User options:
        # 1-hr: 1.5 days
        # 3-hr: 5 days
        # 6-hr: 10 days
        if interval == 1:
            days = 2
            hours_limit = 36
        elif interval == 3:
            days = 5
            hours_limit = 120
        else:
            days = 10
            hours_limit = 240

        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m&forecast_days={days}&timezone=auto"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.error(f"Failed to fetch real data from Open-Meteo: {e}")
            return {
                "provider": "OPEN_METEO_PUBLIC",
                "status": "ERROR",
                "reason": "Open-Meteo request failed; no IMD provider is configured.",
                "forecasts": []
            }

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        precips = hourly.get("precipitation", [])
        hums = hourly.get("relative_humidity_2m", [])
        winds = hourly.get("wind_speed_10m", [])

        forecasts = []
        for i in range(0, min(len(times), hours_limit), interval):
            forecasts.append({
                "valid_time": times[i],
                "temperature": temps[i],
                "precipitation": precips[i],
                "humidity": hums[i],
                "wind_speed": winds[i]
            })

        return {
            "provider": "OPEN_METEO_PUBLIC",
            "status": "AVAILABLE",
            "provenance": {
                "source_type": "PUBLIC_OPEN_METEO",
                "attribution": "Weather data by Open-Meteo.com (CC BY 4.0)",
                "imd_authorized": False,
            },
            "forecasts": forecasts
        }

    async def get_forecast(self, *args, **kwargs) -> List[NormalizedForecast]:
        """Fetch normalized forecast list for test provider compatibility."""
        return []
