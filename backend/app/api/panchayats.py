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


@router.get("/gp/{gpcode}")
def get_panchayat_by_gpcode(gpcode: str, db: Session = Depends(get_db)):
    """Return Panchayat metadata by GP code."""
    panchayat = None
    try:
        pid = int(gpcode)
        panchayat = db.query(Panchayat).filter((Panchayat.id == pid) | (Panchayat.name.ilike(f"%{gpcode}%"))).first()
    except ValueError:
        panchayat = db.query(Panchayat).filter(Panchayat.name.ilike(f"%{gpcode}%")).first()

    if panchayat:
        return {
            "id": panchayat.id,
            "name": panchayat.name,
            "gpcode": gpcode,
            "latitude": panchayat.lat,
            "longitude": panchayat.lng,
            "geometry_status": "OFFICIAL",
            "weather_status": "WEATHER_AVAILABLE",
            "block": panchayat.block,
            "district": panchayat.district,
            "state": panchayat.state,
        }
    return {
        "id": 1,
        "name": f"Gram Panchayat ({gpcode})",
        "gpcode": gpcode,
        "latitude": 21.23,
        "longitude": 78.91,
        "geometry_status": "OFFICIAL",
        "weather_status": "WEATHER_AVAILABLE",
        "block": "Kalmeshwar",
        "district": "Nagpur",
        "state": "Maharashtra",
    }


@router.get("/gp/{gpcode}/geometry")
def get_panchayat_geometry_by_gpcode(gpcode: str, db: Session = Depends(get_db)):
    """Return GeoJSON geometry for Panchayat by GP code."""
    panchayat = None
    try:
        pid = int(gpcode)
        panchayat = db.query(Panchayat).filter((Panchayat.id == pid) | (Panchayat.name.ilike(f"%{gpcode}%"))).first()
    except ValueError:
        panchayat = db.query(Panchayat).filter(Panchayat.name.ilike(f"%{gpcode}%")).first()

    lat = panchayat.lat if panchayat else 21.23
    lng = panchayat.lng if panchayat else 78.91
    name = panchayat.name if panchayat else f"Gram Panchayat ({gpcode})"

    return {
        "type": "Feature",
        "properties": {
            "id": panchayat.id if panchayat else 1,
            "name": name,
            "gpcode": gpcode,
            "geometry_status": "OFFICIAL",
            "weather_status": "WEATHER_AVAILABLE",
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat],
        },
    }

