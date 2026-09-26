from typing import List, Dict, Any
from app.downscaling.base import BaselineLocalizationEngine
from app.models.weather import ForecastRecord

class Baseline0Raw(BaselineLocalizationEngine):
    def apply(self, reference_forecasts: List[ForecastRecord], panchayat_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Baseline 0: Raw/reference forecast mapping.
        No transformation is applied due to lack of independent elevation/station data.
        """
        return {
            "method": "Baseline 0: Raw Reference Mapping",
            "status": "UNVALIDATED BASELINE",
            "transformed_variables": [],
            "assumptions": [
                "Open-Meteo's internal coordinate downscaling is sufficient for Baseline 0.",
                "No physical correction applied due to missing independent Panchayat elevation (z_target)."
            ],
            "limitations": [
                "Requires true Panchayat DEM/elevation for physical lapse-rate correction.",
                "Requires historical station observations for bias correction."
            ],
            "values": [
                {
                    "valid_time": f.valid_time.isoformat(),
                    "temperature": f.temperature,
                    "precipitation": f.precipitation,
                    "humidity": f.humidity,
                    "wind_speed": f.wind_speed,
                    "wind_direction": f.wind_direction
                } for f in reference_forecasts[:24]
            ]
        }
