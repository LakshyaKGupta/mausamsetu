from typing import List
from app.services.localization import LocalizedForecastData as LocalizedForecast
from dataclasses import dataclass
import datetime

@dataclass
class AdvisoryData:
    panchayat_id: int
    target_date: datetime.datetime
    crop_type: str
    advisory_text: str
    severity: str
    basis_data: dict
    issued_at: datetime.datetime

def generate_advisories(forecasts: List[LocalizedForecast], crop_type: str = "General") -> List[AdvisoryData]:
    """
    Phase 8 Agricultural Advisory Engine MVP.
    Converts weather information into transparent agricultural actions based on documented rules.
    """
    advisories = []
    now = datetime.datetime.now(datetime.timezone.utc)
    
    for f in forecasts:
        # Simple Rules for MVP
        if f.localized_precipitation > 2.0:
            a = AdvisoryData(
                panchayat_id=f.panchayat_id,
                target_date=f.valid_time,
                crop_type=crop_type,
                advisory_text="Heavy rain expected. Avoid spraying pesticides or fertilizers today. Ensure proper drainage in fields.",
                severity="Warning",
                basis_data={
                    "precipitation": f.localized_precipitation,
                    "rule": "precip > 2.0mm"
                },
                issued_at=now
            )
            advisories.append(a)
            
        elif f.localized_temperature > 35.0:
            a = AdvisoryData(
                panchayat_id=f.panchayat_id,
                target_date=f.valid_time,
                crop_type=crop_type,
                advisory_text="High temperature stress. Provide protective irrigation if soil moisture is low.",
                severity="Alert",
                basis_data={
                    "temperature": f.localized_temperature,
                    "rule": "temp > 35.0C"
                },
                issued_at=now
            )
            advisories.append(a)
            
        elif f.localized_humidity > 90.0 and f.localized_temperature > 25.0:
            a = AdvisoryData(
                panchayat_id=f.panchayat_id,
                target_date=f.valid_time,
                crop_type=crop_type,
                advisory_text="High humidity and warm temperatures may favor fungal diseases. Monitor crops closely.",
                severity="Info",
                basis_data={
                    "humidity": f.localized_humidity,
                    "temperature": f.localized_temperature,
                    "rule": "humidity > 90% and temp > 25.0C"
                },
                issued_at=now
            )
            advisories.append(a)

    # Deduplicate by day (simplification)
    unique_advisories = {}
    for a in advisories:
        date_str = a.target_date.date().isoformat()
        key = f"{date_str}-{a.severity}"
        if key not in unique_advisories:
            unique_advisories[key] = a
            
    return list(unique_advisories.values())
