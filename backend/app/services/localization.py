from app.models.weather import ForecastRecord
from typing import List
from dataclasses import dataclass
import datetime

@dataclass
class LocalizedForecastData:
    panchayat_id: int
    valid_time: datetime.datetime
    method_version: str
    localized_temperature: float
    localized_precipitation: float
    localized_humidity: float
    localized_wind_speed: float
    localized_wind_direction: float

def generate_baseline_localization(records: List[ForecastRecord], method_name: str = "raw_reference") -> List[LocalizedForecastData]:
    """
    Phase 5 Baseline Localization.
    Currently implements a simple passthrough (raw_reference) as the safest scientific baseline
    before ML models are experimentally validated.
    """
    localized = []
    for r in records:
        loc = LocalizedForecastData(
            panchayat_id=r.panchayat_id,
            valid_time=r.valid_time,
            method_version=method_name,
            # In raw_reference, we assume the reference forecast as our best estimate for the panchayat
            localized_temperature=r.temperature or 0.0,
            localized_precipitation=r.precipitation or 0.0,
            localized_humidity=r.humidity or 0.0,
            localized_wind_speed=r.wind_speed or 0.0,
            localized_wind_direction=r.wind_direction or 0.0,
        )
        localized.append(loc)
    return localized
