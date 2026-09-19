"""
IMD API Connector.
Integrates with India Meteorological Department (IMD) official API platform.
Normalizes IMD Agromet / Block-level forecasts into normalized BlockForecast schema.
"""

from datetime import date, datetime
import logging
from typing import Optional
import httpx

from app.config import settings
from app.schemas.contracts import BlockForecast
from app.services.connectors.base import BaseForecastConnector

logger = logging.getLogger(__name__)


class IMDConnector(BaseForecastConnector):
    """
    Official IMD API Platform Connector.
    Endpoint: IMD Agromet Advisory & Block Forecast Services.
    Requires IMD API registration / account credentials.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "IMD_API_KEY", None)
        self.base_url = base_url or getattr(settings, "IMD_BASE_URL", "https://api.imd.gov.in/v1")

    async def fetch_block_forecast(
        self,
        block_id: str,
        lat: float,
        lon: float,
        target_date: Optional[date] = None,
    ) -> Optional[BlockForecast]:
        """
        Fetch official block forecast from IMD API.
        If credentials are not yet configured or endpoint returns an error,
        returns None so the source-aware fallback can proceed cleanly.
        """
        if not self.api_key:
            logger.info("IMD API key not configured. Fallback source will be engaged.")
            return None

        headers = {
            "X-API-KEY": self.api_key,
            "Accept": "application/json",
        }
        params = {
            "block_id": block_id,
            "lat": lat,
            "lon": lon,
            "date": target_date.isoformat() if target_date else date.today().isoformat(),
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/agromet/block-forecast", headers=headers, params=params)
                if resp.status_code == 401 or resp.status_code == 403:
                    logger.warning("IMD API authentication failed. Verify credentials.")
                    return None
                resp.raise_for_status()
                data = resp.json()

                # IMD Agromet API response mapping
                # Expected fields: BlockCode, BlockName, DistrictName, StateName, ForecastDate, Rainfall, TempMax, TempMin, Humidity, WindSpeed, WindDirection
                payload = data.get("data", data)
                return BlockForecast(
                    block_id=str(payload.get("BlockCode", block_id)),
                    block_name=str(payload.get("BlockName", "Unknown")),
                    district_name=str(payload.get("DistrictName", "Unknown")),
                    state_name=str(payload.get("StateName", "Unknown")),
                    forecast_issued_at=datetime.utcnow(),
                    forecast_target_date=target_date or date.today(),
                    lead_time_hours=24,
                    rainfall_mm=float(payload.get("Rainfall", 0.0)),
                    temp_max_c=float(payload.get("TempMax", 30.0)),
                    temp_min_c=float(payload.get("TempMin", 20.0)),
                    humidity_morning_pct=float(payload.get("Humidity", 60.0)) if payload.get("Humidity") else None,
                    wind_speed_kmh=float(payload.get("WindSpeed", 10.0)) if payload.get("WindSpeed") else None,
                    wind_direction_deg=float(payload.get("WindDirection", 0.0)) if payload.get("WindDirection") else None,
                    source_name="IMD_API_AGROMET",
                )
        except Exception as e:
            logger.error(f"Error fetching from IMD API: {e}")
            return None
