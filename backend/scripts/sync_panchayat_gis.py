"""
sync_panchayat_gis.py — Fetch Gram Panchayat Polygons and Points from Official ArcGIS REST Services
and stage them for reconciliation.

Usage:
    python -m backend.scripts.sync_panchayat_gis --state-code 27
    python -m backend.scripts.sync_panchayat_gis --all-india
"""

import asyncio
import argparse
import logging
import json
import os
import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
from app.gis.service import GISService

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

async def init_staging_tables(engine):
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS staging_gis_polygons (
                gpcode VARCHAR(50) PRIMARY KEY,
                gpname VARCHAR(255),
                st_lgd INTEGER,
                dt_lgd INTEGER,
                blklgdcode VARCHAR(50),
                geometry GEOMETRY(Polygon, 4326),
                source_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS staging_gis_points (
                gp_code VARCHAR(50) PRIMARY KEY,
                gp_name VARCHAR(255),
                st_lgd INTEGER,
                dt_lgd INTEGER,
                sdt_lgd INTEGER,
                lat FLOAT,
                lon FLOAT,
                source_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

async def fetch_and_stage_state(engine, service, state_code: int):
    logger.info(f"Starting GIS extraction for State LGD Code: {state_code}")
    
    # 1. Fetch Polygons
    logger.info("Fetching polygons from BharatMaps...")
    polygons = []
    async for feature in service.fetch_state_polygons(state_code):
        props = feature.get("properties", {})
        geom = feature.get("geometry")
        
        if not props.get("GPCODE") or not geom:
            continue
            
        polygons.append({
            "gpcode": str(props["GPCODE"]),
            "gpname": props.get("GPNAME", ""),
            "st_lgd": props.get("ST_LGD"),
            "dt_lgd": props.get("DT_LGD"),
            "blklgdcode": str(props.get("blklgdcode", "")),
            "geom_json": json.dumps(geom)
        })
        
        if len(polygons) >= 1000:
            await bulk_insert_polygons(engine, polygons)
            polygons = []
            
    if polygons:
        await bulk_insert_polygons(engine, polygons)

    # 2. Fetch Points
    logger.info("Fetching points from GramManchitra...")
    points = []
    async for feature in service.fetch_state_points(state_code):
        props = feature.get("properties", {})
        
        if not props.get("gp_code") or not props.get("lat") or not props.get("lONG"):
            continue
            
        points.append({
            "gp_code": str(int(props["gp_code"])) if isinstance(props["gp_code"], float) else str(props["gp_code"]),
            "gp_name": props.get("gp_name", ""),
            "st_lgd": props.get("ST_LGD"),
            "dt_lgd": props.get("DT_LGD"),
            "sdt_lgd": props.get("SDT_LGD"),
            "lat": float(props["lat"]),
            "lon": float(props["lONG"])
        })
        
        if len(points) >= 1000:
            await bulk_insert_points(engine, points)
            points = []
            
    if points:
        await bulk_insert_points(engine, points)

async def bulk_insert_polygons(engine, records):
    async with engine.begin() as conn:
        for r in records:
            await conn.execute(text("""
                INSERT INTO staging_gis_polygons (gpcode, gpname, st_lgd, dt_lgd, blklgdcode, geometry)
                VALUES (:gpcode, :gpname, :st_lgd, :dt_lgd, :blklgdcode, ST_GeomFromGeoJSON(:geom_json))
                ON CONFLICT (gpcode) DO UPDATE SET
                    geometry = EXCLUDED.geometry,
                    gpname = EXCLUDED.gpname,
                    source_timestamp = CURRENT_TIMESTAMP
            """), r)
    logger.info(f"Inserted/Updated {len(records)} polygons")

async def bulk_insert_points(engine, records):
    async with engine.begin() as conn:
        for r in records:
            await conn.execute(text("""
                INSERT INTO staging_gis_points (gp_code, gp_name, st_lgd, dt_lgd, sdt_lgd, lat, lon)
                VALUES (:gp_code, :gp_name, :st_lgd, :dt_lgd, :sdt_lgd, :lat, :lon)
                ON CONFLICT (gp_code) DO UPDATE SET
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon,
                    gp_name = EXCLUDED.gp_name,
                    source_timestamp = CURRENT_TIMESTAMP
            """), r)
    logger.info(f"Inserted/Updated {len(records)} points")

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state-code", type=int, help="LGD State Code (e.g. 27 for Maharashtra)")
    parser.add_argument("--all-india", action="store_true", help="Process all states")
    args = parser.parse_args()

    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    await init_staging_tables(engine)
    
    service = GISService()
    
    try:
        if args.state_code:
            await fetch_and_stage_state(engine, service, args.state_code)
        elif args.all_india:
            logger.error("--all-india not yet implemented, running Maharashtra first!")
        else:
            parser.print_help()
    finally:
        await service.close()
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
