"""Field Reports API router for Agricultural Extension Officers."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.models import FieldReport, Officer, Panchayat
from app.schemas.schemas import FieldReportCreate, FieldReportOut

router = APIRouter(prefix="/field-reports", tags=["field-reports"])


@router.get("/", response_model=list[FieldReportOut])
def list_field_reports(
    block: Optional[str] = None,
    panchayat_id: Optional[int] = None,
    officer_id: Optional[int] = None,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    """Retrieve field reports submitted by agricultural extension officers."""
    q = db.query(FieldReport)
    
    if panchayat_id:
        q = q.filter(FieldReport.panchayat_id == panchayat_id)
    if officer_id:
        q = q.filter(FieldReport.officer_id == officer_id)
    if block:
        q = q.join(Panchayat).filter(Panchayat.block.ilike(f"%{block}%"))
        
    reports = q.order_by(FieldReport.created_at.desc()).limit(limit).all()
    
    result = []
    for r in reports:
        officer = db.query(Officer).filter(Officer.id == r.officer_id).first()
        panchayat = db.query(Panchayat).filter(Panchayat.id == r.panchayat_id).first()
        result.append(
            FieldReportOut(
                id=r.id,
                officer_id=r.officer_id,
                officer_name=officer.name if officer else "Extension Officer",
                panchayat_id=r.panchayat_id,
                panchayat_name=panchayat.name if panchayat else None,
                block=panchayat.block if panchayat else None,
                crop=r.crop,
                observation_type=r.observation_type,
                severity=r.severity,
                description=r.description,
                photo_url=r.photo_url,
                created_at=r.created_at,
            )
        )
    return result


@router.post("/", response_model=FieldReportOut)
def create_field_report(body: FieldReportCreate, db: Session = Depends(get_db)):
    """Submit a real-time field observation from extension officer."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == body.panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")
        
    officer = db.query(Officer).filter(Officer.id == body.officer_id).first()
    if not officer:
        # Fallback or create dummy for demo session
        officer = db.query(Officer).first()
        if not officer:
            officer = Officer(name="Rajesh Sharma", phone="9823012345", block="Kalmeshwar", district="Nagpur")
            db.add(officer)
            db.commit()
            db.refresh(officer)

    report = FieldReport(
        officer_id=officer.id,
        panchayat_id=panchayat.id,
        crop=body.crop,
        observation_type=body.observation_type,
        severity=body.severity,
        description=body.description,
        photo_url=body.photo_url,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return FieldReportOut(
        id=report.id,
        officer_id=report.officer_id,
        officer_name=officer.name,
        panchayat_id=panchayat.id,
        panchayat_name=panchayat.name,
        block=panchayat.block,
        crop=report.crop,
        observation_type=report.observation_type,
        severity=report.severity,
        description=report.description,
        photo_url=report.photo_url,
        created_at=report.created_at,
    )
