from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from app.database.base import Base
from datetime import datetime

class Advisory(Base):
    __tablename__ = "advisories"
    id = Column(Integer, primary_key=True, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"))
    
    crop = Column(String)
    crop_stage = Column(String, nullable=True)
    status = Column(String, default="pending") # draft, pending, approved, sent
    advisory_date = Column(DateTime, default=datetime.utcnow)
    confidence_score = Column(Float, default=85.0)
    baseline_rainfall_mm = Column(Float, nullable=True)
    predicted_rainfall_mm = Column(Float, nullable=True)
    model_diff_mm = Column(Float, nullable=True)
    reliability_tier = Column(String, default="HIGH")
    is_imd_fallback = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    content_hi = Column(String, nullable=True)
    content_en = Column(String, nullable=True)
    officer_note = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
