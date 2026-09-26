from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class NormalizedForecast(BaseModel):
    panchayat_id: int
    issue_time: datetime
    valid_time: datetime
    temperature: float
    precipitation: float
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    provenance: dict
    
    @property
    def lead_time_hours(self) -> float:
        return (self.valid_time - self.issue_time).total_seconds() / 3600.0

class WeatherProvider(ABC):
    @abstractmethod
    async def get_forecast(self, lat: float, lon: float, panchayat_id: int) -> List[NormalizedForecast]:
        pass

class HistoricalWeatherProvider(ABC):
    @abstractmethod
    async def get_historical_data(self, lat: float, lon: float, start_date: datetime, end_date: datetime) -> List[NormalizedForecast]:
        pass
