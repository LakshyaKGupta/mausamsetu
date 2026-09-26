from abc import ABC, abstractmethod
from typing import List, Dict, Any
from app.models.weather import ForecastRecord

class BaselineLocalizationEngine(ABC):
    @abstractmethod
    def apply(self, reference_forecasts: List[ForecastRecord], panchayat_context: Dict[str, Any]) -> Dict[str, Any]:
        pass
