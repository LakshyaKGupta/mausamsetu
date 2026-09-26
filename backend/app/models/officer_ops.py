from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from app.database.base import Base
from datetime import datetime

class FieldReport(Base):
    __tablename__ = "field_reports"
    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, index=True)
    panchayat_id = Column(Integer, ForeignKey("panchayats.id"), index=True)
    crop = Column(String)
    crop_stage = Column(String, nullable=True)
    category = Column(String)
    severity = Column(String)
    observation_notes = Column(Text)
    action_recommended = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AdvisoryAudit(Base):
    __tablename__ = "advisory_audits"
    id = Column(Integer, primary_key=True, index=True)
    advisory_id = Column(Integer, ForeignKey("advisories.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    stage = Column(String)
    actor = Column(String)
    role = Column(String)
    action = Column(String)
    details = Column(Text)
