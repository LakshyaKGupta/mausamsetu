"""Panchayats API router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Panchayat
from app.schemas.schemas import PanchayatCreate, PanchayatOut

router = APIRouter(prefix="/panchayats", tags=["panchayats"])


@router.get("/", response_model=list[PanchayatOut])
def list_panchayats(district: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Panchayat)
    if district:
        q = q.filter(Panchayat.district.ilike(f"%{district}%"))
    return q.order_by(Panchayat.name).all()


@router.get("/{panchayat_id}", response_model=PanchayatOut)
def get_panchayat(panchayat_id: int, db: Session = Depends(get_db)):
    p = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Panchayat not found")
    return p


@router.post("/", response_model=PanchayatOut)
def create_panchayat(body: PanchayatCreate, db: Session = Depends(get_db)):
    p = Panchayat(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
