import httpx
import logging
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.providers.base import WeatherProvider, NormalizedForecast
from app.core.config import settings
import asyncio

logger = logging.getLogger(__name__)

class IMDProvider(WeatherProvider):
    """
    India Meteorological Department (IMD) Official Provider.
    """
    
    def __init__(self):
        self.base_url = settings.IMD_BASE_URL
        self.api_key = settings.IMD_API_KEY
        self.headers = {}
        if self.api_key:
            self.headers["Authorization"] = f"Bearer {self.api_key}"
            
        self.client = httpx.AsyncClient(timeout=10.0, headers=self.headers)
        
    async def _fetch_with_retry(self, url: str, params: dict = None, retries: int = 3):
        if not self.api_key:
            logger.warning("IMD API key missing. Using mocked response.")
            return self._get_mocked_response()

        for attempt in range(retries):
            try:
                response = await self.client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning("IMD Rate limit hit. Backing off.")
                    await asyncio.sleep(2 ** attempt)
                    continue
                logger.error(f"HTTP error from IMD: {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Request error connecting to IMD: {e}")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(1)

        raise Exception("Failed to fetch from IMD after multiple retries.")
        
    def _get_mocked_response(self):
        # Mocked response structure for when API key is not available yet
        return {
            "Date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "Station_Name": "Nearest IMD Station (Mock)",
            "Todays_Forecast_Max_Temp": 34.5,
            "Todays_Forecast_Min_temp": 24.2,
            "Past_24_hrs_Rainfall": 0.0,
            "Todays_Forecast": "Partly Cloudy",
            "Day_2_Max_Temp": 35.0,
            "Day_2_Min_temp": 24.5,
            "Day_2_Forecast": "Clear Sky"
        }

    async def get_forecast(self, lat: float, lon: float, panchayat_id: int) -> List[NormalizedForecast]:
        """
        Fetches the 7-day city weather forecast from IMD.
        Since exact coordinate-to-city mapping documentation is limited,
        we mock the bounding logic.
        """
        # Endpoint: /api/v1/cityforecastloc
        url = f"{self.base_url}/cityforecastloc"
        params = {"lat": lat, "lon": lon} # Assumed based on API name
        
        try:
            data = await self._fetch_with_retry(url, params=params)
        except Exception as e:
            logger.error(f"Failed to fetch forecast from IMD for panchayat {panchayat_id}: {e}")
            return []

        forecasts = []
        issue_time = datetime.now(timezone.utc)
        
        provenance = {
            "source": "IMD",
            "resolution": "NEAREST_IMD_STATION", # We state what it is
            "station_name": data.get("Station_Name", "Unknown"),
            "retrieved_at": issue_time.isoformat()
        }

        # Day 1
        day1_valid = issue_time
        forecasts.append(NormalizedForecast(
            panchayat_id=panchayat_id,
            issue_time=issue_time,
            valid_time=day1_valid,
            temperature=(data.get("Todays_Forecast_Max_Temp", 30) + data.get("Todays_Forecast_Min_temp", 20)) / 2, # Avg
            precipitation=float(data.get("Past_24_hrs_Rainfall", 0)),
            humidity=float(data.get("Relative_Humidity_at_0830", 0)) or None,
            provenance=provenance
        ))
        
        # Day 2
        day2_valid = issue_time + timedelta(days=1)
        forecasts.append(NormalizedForecast(
            panchayat_id=panchayat_id,
            issue_time=issue_time,
            valid_time=day2_valid,
            temperature=(data.get("Day_2_Max_Temp", 30) + data.get("Day_2_Min_temp", 20)) / 2,
            precipitation=0.0,
            humidity=None,
            provenance=provenance
        ))

        return forecasts

    async def close(self):
        await self.client.aclose()
