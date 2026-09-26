from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from app.database.base import Base
import datetime

class ForecastSource(Base):
    __tablename__ = "forecast_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g. Open-Meteo, IMD, GFS
    description = Column(String, nullable=True)

class ForecastRecord(Base):
    __tablename__ = "forecast_records"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("forecast_sources.id"))
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"))
    
    issue_time = Column(DateTime(timezone=True), index=True)
    valid_time = Column(DateTime(timezone=True), index=True)
    
    # Weather variables
    temperature = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    
    provenance = Column(JSONB, nullable=True)

class LocalizedForecast(Base):
    __tablename__ = "localized_forecasts"
    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"))
    valid_time = Column(DateTime(timezone=True), index=True)
    
    variable = Column(String) # e.g. temperature, precipitation
    reference_value = Column(Float)
    localized_value = Column(Float)
    unit = Column(String)
    
    method_id = Column(String) # e.g. baseline_lapse_rate
    model_version = Column(String, nullable=True)
    
    reliability_status = Column(String) # High, Moderate, Low
    uncertainty_min = Column(Float, nullable=True)
    uncertainty_max = Column(Float, nullable=True)
    
    fallback_used = Column(Boolean, default=False)
    fallback_reason = Column(String, nullable=True)
    
    provenance = Column(JSONB, nullable=True)
