from sqlalchemy.ext.asyncio import AsyncSession
from app.providers.base import WeatherProvider
from app.models.weather import ForecastRecord
import datetime

async def fetch_and_store_forecast(
    db: AsyncSession, 
    provider: WeatherProvider, 
    lat: float, 
    lon: float, 
    panchayat_id: int, 
    source_id: int
):
    normalized_forecasts = await provider.get_forecast(lat, lon, panchayat_id)
    
    records = []
    for nf in normalized_forecasts:
        record = ForecastRecord(
            provider_id=source_id,
            panchayat_id=panchayat_id,
            issue_time=nf.issue_time,
            valid_time=nf.valid_time,
            temperature=nf.temperature,
            precipitation=nf.precipitation,
            humidity=nf.humidity,
            wind_speed=nf.wind_speed,
            wind_direction=nf.wind_direction,
            provenance=nf.provenance
        )
        records.append(record)
        
    db.add_all(records)
    await db.commit()
    return len(records)
