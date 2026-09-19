"""Advisories API router — full CRUD + approval workflow."""

from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.models import (
    Advisory,
    AdvisoryStatus,
    Approval,
    ApprovalAction,
    Panchayat,
    Officer,
    WeatherObservation,
)
from app.schemas.schemas import (
    AdvisoryApproveRequest,
    AdvisoryGenerateRequest,
    AdvisoryListItem,
    AdvisoryOut,
    MessageResponse,
    StatsResponse,
)
from app.ml.advisory_generator import generate_advisory, WeatherInput
from app.ml.weather_downscaler import fetch_block_forecast, downscale_to_panchayat, make_mock_weather

router = APIRouter(prefix="/advisories", tags=["advisories"])


async def _get_weather_for_panchayat(panchayat: Panchayat, db: Session) -> tuple[WeatherInput, float]:
    """Get panchayat weather, using cached DB observation if available."""
    today = date.today()
    existing = db.query(WeatherObservation).filter(
        WeatherObservation.panchayat_id == panchayat.id,
        WeatherObservation.observed_at >= datetime(today.year, today.month, today.day),
    ).first()

    if existing:
        return (
            WeatherInput(
                temperature_max=existing.temperature_max or 30.0,
                temperature_min=existing.temperature_min or 20.0,
                rainfall_mm=existing.rainfall_mm or 0.0,
                humidity_pct=existing.humidity_pct or 60.0,
                wind_speed_kmh=existing.wind_speed_kmh or 10.0,
                cloud_cover_pct=existing.cloud_cover_pct or 30.0,
            ),
            existing.confidence_score,
        )

    block = await fetch_block_forecast(panchayat.lat, panchayat.lng)
    if block:
        return downscale_to_panchayat(block, panchayat.lat, panchayat.lng, panchayat.elevation_m)

    return make_mock_weather(panchayat.id)


def _serialize_advisory(advisory: Advisory, db: Session) -> AdvisoryOut:
    panchayat = db.query(Panchayat).filter(Panchayat.id == advisory.panchayat_id).first()
    return AdvisoryOut(
        id=advisory.id,
        panchayat_id=advisory.panchayat_id,
        crop=advisory.crop,
        advisory_date=advisory.advisory_date,
        content_en=advisory.content_en,
        content_hi=advisory.content_hi,
        content_mr=advisory.content_mr,
        confidence_score=advisory.confidence_score,
        ml_explanation=advisory.ml_explanation,
        weather_snapshot=advisory.weather_snapshot,
        is_imd_fallback=advisory.is_imd_fallback,
        status=advisory.status,
        officer_note=advisory.officer_note,
        approved_at=advisory.approved_at,
        sent_at=advisory.sent_at,
        created_at=advisory.created_at,
        panchayat_name=panchayat.name if panchayat else None,
    )


# ---------------------------------------------------------------------------
# Generate
# ---------------------------------------------------------------------------


@router.post("/generate", response_model=AdvisoryOut)
async def generate(body: AdvisoryGenerateRequest, db: Session = Depends(get_db)):
    """Generate an AI advisory for a panchayat × crop pair."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == body.panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    weather_input, ml_confidence = await _get_weather_for_panchayat(panchayat, db)
    result = generate_advisory(weather_input, body.crop, ml_confidence_override=ml_confidence)

    advisory = Advisory(
        panchayat_id=panchayat.id,
        crop=body.crop,
        advisory_date=body.advisory_date or datetime.utcnow(),
        content_en=result.content_en,
        content_hi=result.content_hi,
        content_mr=result.content_mr,
        confidence_score=result.confidence_score,
        ml_explanation=result.ml_explanation,
        weather_snapshot=result.weather_snapshot,
        is_imd_fallback=result.is_imd_fallback,
        status=AdvisoryStatus.pending,
    )
    db.add(advisory)
    db.commit()
    db.refresh(advisory)

    return _serialize_advisory(advisory, db)


# ---------------------------------------------------------------------------
# List (Officer Queue)
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[AdvisoryListItem])
def list_advisories(
    status: Optional[AdvisoryStatus] = None,
    panchayat_id: Optional[int] = None,
    crop: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Advisory)
    if status:
        q = q.filter(Advisory.status == status)
    if panchayat_id:
        q = q.filter(Advisory.panchayat_id == panchayat_id)
    if crop:
        q = q.filter(Advisory.crop.ilike(f"%{crop}%"))

    advisories = q.order_by(Advisory.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for a in advisories:
        panchayat = db.query(Panchayat).filter(Panchayat.id == a.panchayat_id).first()
        result.append(AdvisoryListItem(
            id=a.id,
            panchayat_id=a.panchayat_id,
            panchayat_name=panchayat.name if panchayat else None,
            crop=a.crop,
            advisory_date=a.advisory_date,
            status=a.status,
            confidence_score=a.confidence_score,
            is_imd_fallback=a.is_imd_fallback,
            created_at=a.created_at,
        ))
    return result


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    today = datetime.utcnow().date()

    total_panchayats = db.query(Panchayat).count()
    from app.models.models import Farmer
    total_farmers = db.query(Farmer).count()
    pending = db.query(Advisory).filter(Advisory.status == AdvisoryStatus.pending).count()
    approved_today = db.query(Advisory).filter(
        Advisory.status == AdvisoryStatus.approved,
        Advisory.approved_at >= datetime(today.year, today.month, today.day),
    ).count()
    sent_today = db.query(Advisory).filter(
        Advisory.status == AdvisoryStatus.sent,
        Advisory.sent_at >= datetime(today.year, today.month, today.day),
    ).count()

    return StatsResponse(
        total_panchayats=total_panchayats,
        total_farmers=total_farmers,
        pending_advisories=pending,
        approved_today=approved_today,
        sent_today=sent_today,
    )


# ---------------------------------------------------------------------------
# Get single advisory
# ---------------------------------------------------------------------------


@router.get("/{advisory_id}", response_model=AdvisoryOut)
def get_advisory(advisory_id: int, db: Session = Depends(get_db)):
    advisory = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")
    return _serialize_advisory(advisory, db)


# ---------------------------------------------------------------------------
# Approve / Modify / Reject
# ---------------------------------------------------------------------------


@router.patch("/{advisory_id}/review", response_model=AdvisoryOut)
def review_advisory(
    advisory_id: int,
    body: AdvisoryApproveRequest,
    officer_id: int = Query(..., description="Officer ID (from auth token in production)"),
    db: Session = Depends(get_db),
):
    """Officer reviews advisory: approve, modify, or reject."""
    advisory = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")

    if advisory.status not in (AdvisoryStatus.pending, AdvisoryStatus.draft):
        raise HTTPException(status_code=400, detail=f"Advisory is already {advisory.status}")

    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    # Record approval action
    approval = Approval(
        advisory_id=advisory_id,
        officer_id=officer_id,
        action=body.action,
        note=body.note,
        modified_content_hi=body.modified_content_hi,
        modified_content_en=body.modified_content_en,
        modified_content_mr=body.modified_content_mr,
    )
    db.add(approval)

    # Apply officer edits if provided
    if body.modified_content_hi:
        advisory.content_hi = body.modified_content_hi
    if body.modified_content_en:
        advisory.content_en = body.modified_content_en
    if body.modified_content_mr:
        advisory.content_mr = body.modified_content_mr

    advisory.officer_id = officer_id
    advisory.officer_note = body.note

    if body.action in (ApprovalAction.approved, ApprovalAction.modified):
        advisory.status = AdvisoryStatus.approved
        advisory.approved_at = datetime.utcnow()
    elif body.action == ApprovalAction.rejected:
        advisory.status = AdvisoryStatus.rejected

    db.commit()
    db.refresh(advisory)

    return _serialize_advisory(advisory, db)


@router.post("/{advisory_id}/send", response_model=AdvisoryOut)
def mark_as_sent(advisory_id: int, db: Session = Depends(get_db)):
    """Mark approved advisory as sent to farmers."""
    advisory = db.query(Advisory).filter(Advisory.id == advisory_id).first()
    if not advisory:
        raise HTTPException(status_code=404, detail="Advisory not found")

    if advisory.status != AdvisoryStatus.approved:
        raise HTTPException(status_code=400, detail="Advisory must be approved before sending")

    advisory.status = AdvisoryStatus.sent
    advisory.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(advisory)

    return _serialize_advisory(advisory, db)


# ---------------------------------------------------------------------------
# Farmer-facing: approved advisories for a panchayat
# ---------------------------------------------------------------------------


@router.get("/panchayat/{panchayat_id}/approved", response_model=list[AdvisoryOut])
def get_approved_for_panchayat(
    panchayat_id: int,
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
):
    """Get approved + sent advisories for a panchayat (farmer-facing)."""
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    advisories = (
        db.query(Advisory)
        .filter(
            Advisory.panchayat_id == panchayat_id,
            Advisory.status.in_([AdvisoryStatus.approved, AdvisoryStatus.sent]),
        )
        .order_by(Advisory.advisory_date.desc())
        .limit(limit)
        .all()
    )

    return [_serialize_advisory(a, db) for a in advisories]
