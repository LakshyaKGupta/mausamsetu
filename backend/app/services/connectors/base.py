"""
Base interface for MausamSetu Data Connectors.
All connectors must return normalized schemas defined in app.schemas.contracts.
"""

from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional

from app.schemas.contracts import BlockForecast, Observation, PanchayatGeoFeatures


class BaseForecastConnector(ABC):
    """Abstract connector for block-level weather forecasts."""

    @abstractmethod
    async def fetch_block_forecast(
        self,
        block_id: str,
        lat: float,
        lon: float,
        target_date: Optional[date] = None,
    ) -> Optional[BlockForecast]:
        """Fetch forecast for a given block."""
        pass


class BaseObservationConnector(ABC):
    """Abstract connector for ground station observations."""

    @abstractmethod
    async def fetch_station_observation(
        self,
        station_id: str,
        obs_date: date,
    ) -> Optional[Observation]:
        """Fetch daily ground observation for a station."""
        pass

    @abstractmethod
    async def get_nearby_stations(
        self,
        lat: float,
        lon: float,
        max_distance_km: float = 50.0,
    ) -> List[dict]:
        """Return list of available stations near coordinates."""
        pass


class BaseGISConnector(ABC):
    """Abstract connector for terrain and spatial features."""

    @abstractmethod
    def get_panchayat_geo_features(
        self,
        panchayat_id: str,
        centroid_lat: float,
        centroid_lon: float,
        block_id: str,
        panchayat_name: str,
    ) -> PanchayatGeoFeatures:
        """Extract elevation, slope, aspect, and nearest station distance."""
        pass
