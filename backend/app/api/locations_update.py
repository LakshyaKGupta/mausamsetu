from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from app.database.session import get_db
from app.models.location import Panchayat, Block, District, State
import json

router = APIRouter()

@router.get("/panchayats/{gpcode}")
async def get_panchayat_by_gpcode(gpcode: str, db: AsyncSession = Depends(get_db)):
    """Return Panchayat details by GP Code."""
    query = (
        select(
            Panchayat.id,
            Panchayat.name,
            Panchayat.lgd_code,
            Panchayat.latitude,
            Panchayat.longitude,
            Panchayat.geometry_status,
            Panchayat.weather_status,
            Block.name.label("block_name"),
            District.name.label("district_name"),
            State.name.label("state_name")
        )
        .join(Block, Panchayat.block_id == Block.id)
        .join(District, Block.district_id == District.id)
        .join(State, District.state_id == State.id)
        .filter(Panchayat.lgd_code == int(gpcode))
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Panchayat not found")
        
    return {
        "id": row.id,
        "name": row.name,
        "gpcode": row.lgd_code,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "geometry_status": row.geometry_status,
        "weather_status": row.weather_status,
        "block": row.block_name,
        "district": row.district_name,
        "state": row.state_name
    }

@router.get("/panchayats/{gpcode}/geometry")
async def get_panchayat_geometry_by_gpcode(gpcode: str, db: AsyncSession = Depends(get_db)):
    """Return GeoJSON Feature for a panchayat by GP code."""
    query = select(
        Panchayat.id,
        Panchayat.name,
        Panchayat.lgd_code,
        Panchayat.geometry_status,
        Panchayat.geometry_source,
        Panchayat.weather_status,
        func.ST_AsGeoJSON(Panchayat.geometry).label("geojson"),
    ).filter(Panchayat.lgd_code == int(gpcode))

    result = await db.execute(query)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Panchayat not found")

    if not row.geojson:
        raise HTTPException(status_code=404, detail="Geometry not available for this panchayat")

    geometry = json.loads(row.geojson)

    return {
        "type": "Feature",
        "geometry": geometry,
        "properties": {
            "id": row.id,
            "name": row.name,
            "gpcode": row.lgd_code,
            "geometry_status": row.geometry_status,
            "geometry_source": row.geometry_source,
            "weather_status": row.weather_status,
        }
    }
