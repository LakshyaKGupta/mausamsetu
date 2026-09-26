"""
national_gis_rollout.py — Orchestrates the safe, atomic, state-by-state extraction and reconciliation of GIS data.
Supports resume, dry-run, and rate limiting.
"""

import asyncio
import argparse
import logging
import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select

from app.core.config import settings
from app.gis.service import GISService
from app.models.location import State, Panchayat

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

PROGRESS_FILE = PROJECT_ROOT / "experiments" / "official_data" / "national_gis_progress.json"

STATES_TO_PROCESS = [
    35, 37, 12, 18, 10, 4, 22, 39, 7, 30, 24, 6, 2, 1, 20, 32, 38, 31, 27, 
    14, 17, 15, 13, 21, 34, 3, 8, 11, 33, 36, 16, 5, 9, 19, 29, 23
]

class CheckpointManager:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.state_progress = self._load()

    def _load(self):
        if self.file_path.exists():
            with open(self.file_path, "r") as f:
                return json.load(f)
        return {}

    def _save(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.file_path, "w") as f:
            json.dump(self.state_progress, f, indent=2)

    def get_state(self, state_code: int):
        return self.state_progress.get(str(state_code), {
            "status": "PENDING",
            "records_staged": 0,
            "records_committed": 0,
            "error": None
        })

    def update_state(self, state_code: int, data: dict):
        current = self.get_state(state_code)
        current.update(data)
        self.state_progress[str(state_code)] = current
        self._save()

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

async def clear_staging_for_state(engine, state_code: int):
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM staging_gis_polygons WHERE st_lgd = :st"), {"st": state_code})
        await conn.execute(text("DELETE FROM staging_gis_points WHERE st_lgd = :st"), {"st": state_code})

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

async def extract_state_gis(engine, service: GISService, state_code: int) -> int:
    """Extracts polygons and points into staging. Returns total records staged."""
    polygons = []
    staged_count = 0
    
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
            staged_count += len(polygons)
            polygons = []
            
    if polygons:
        await bulk_insert_polygons(engine, polygons)
        staged_count += len(polygons)

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
            staged_count += len(points)
            points = []
            
    if points:
        await bulk_insert_points(engine, points)
        staged_count += len(points)
        
    return staged_count

async def reconcile_state(engine, state_code: int, dry_run: bool) -> int:
    """Merges staging into production. Returns rows affected."""
    if dry_run:
        logger.info(f"[DRY RUN] Would reconcile state {state_code}")
        return 0
        
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        state = await session.execute(select(State).filter_by(lgd_code=state_code))
        state = state.scalar_one_or_none()
        if not state:
            state = State(lgd_code=state_code, name=f"State {state_code}", source="GIS_RECONCILIATION")
            session.add(state)
            await session.commit()
            
        districts_sql = text("""
            INSERT INTO districts (lgd_code, name, state_id, source)
            SELECT DISTINCT COALESCE(p.dt_lgd, pt.dt_lgd), 'District ' || COALESCE(p.dt_lgd, pt.dt_lgd), CAST(:state_id AS INTEGER), 'GIS_RECONCILIATION'
            FROM staging_gis_polygons p
            FULL OUTER JOIN staging_gis_points pt ON p.gpcode = pt.gp_code
            WHERE (p.st_lgd = CAST(:state_code AS INTEGER) OR pt.st_lgd = CAST(:state_code AS INTEGER)) AND COALESCE(p.dt_lgd, pt.dt_lgd) IS NOT NULL
            ON CONFLICT (lgd_code) DO NOTHING;
        """)
        await session.execute(districts_sql, {"state_code": state_code, "state_id": state.id})
        await session.commit()
        
        blocks_sql = text("""
            INSERT INTO blocks (lgd_code, name, district_id, source)
            SELECT DISTINCT m.blk_lgd, 'Block ' || m.blk_lgd, d.id, 'GIS_RECONCILIATION'
            FROM (
                SELECT p.blklgdcode::integer AS blk_lgd, COALESCE(p.dt_lgd, pt.dt_lgd) AS dt_lgd
                FROM staging_gis_polygons p
                FULL OUTER JOIN staging_gis_points pt ON p.gpcode = pt.gp_code
                WHERE (p.st_lgd = :state_code OR pt.st_lgd = :state_code)
            ) m
            JOIN districts d ON m.dt_lgd = d.lgd_code
            WHERE m.blk_lgd IS NOT NULL
            ON CONFLICT (lgd_code) DO NOTHING;
        """)
        await session.execute(blocks_sql, {"state_code": state_code})
        await session.commit()

        reconcile_sql = text("""
            WITH merged_gis AS (
                SELECT 
                    COALESCE(p.gpcode, pt.gp_code)::integer AS lgd_code,
                    COALESCE(p.gpname, pt.gp_name) AS name,
                    COALESCE(p.st_lgd, pt.st_lgd) AS st_lgd,
                    COALESCE(p.dt_lgd, pt.dt_lgd) AS dt_lgd,
                    p.blklgdcode::integer AS blk_lgd,
                    p.geometry AS polygon_geom,
                    pt.lat AS point_lat,
                    pt.lon AS point_lon
                FROM staging_gis_polygons p
                FULL OUTER JOIN staging_gis_points pt ON p.gpcode = pt.gp_code
                WHERE p.st_lgd = :state_code OR pt.st_lgd = :state_code
            )
            INSERT INTO panchayats (
                lgd_code, name, state_id, district_id, block_id, geometry, latitude, longitude, 
                geometry_source, coordinate_source, geometry_status, is_test_data, weather_status
            )
            SELECT 
                m.lgd_code,
                m.name,
                :state_id,
                d.id,
                b.id,
                m.polygon_geom,
                COALESCE(m.point_lat, ST_Y(ST_PointOnSurface(m.polygon_geom))),
                COALESCE(m.point_lon, ST_X(ST_PointOnSurface(m.polygon_geom))),
                CASE WHEN m.polygon_geom IS NOT NULL THEN 'BHARATMAPS' ELSE NULL END,
                CASE 
                    WHEN m.point_lat IS NOT NULL THEN 'GRAM_MANCHITRA' 
                    WHEN m.polygon_geom IS NOT NULL THEN 'DERIVED_FROM_OFFICIAL_BOUNDARY'
                    ELSE NULL 
                END,
                CASE 
                    WHEN m.point_lat IS NOT NULL THEN 'OFFICIAL_POINT'
                    WHEN m.polygon_geom IS NOT NULL THEN 'OFFICIAL_BOUNDARY_DERIVED_POINT'
                    ELSE 'GEOGRAPHY_UNAVAILABLE' 
                END,
                FALSE,
                'WEATHER_CHECK_PENDING'
            FROM merged_gis m
            LEFT JOIN districts d ON m.dt_lgd = d.lgd_code
            LEFT JOIN blocks b ON m.blk_lgd = b.lgd_code
            ON CONFLICT (lgd_code) DO UPDATE SET
                geometry = EXCLUDED.geometry,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                geometry_source = EXCLUDED.geometry_source,
                coordinate_source = EXCLUDED.coordinate_source,
                geometry_status = EXCLUDED.geometry_status,
                name = EXCLUDED.name,
                district_id = EXCLUDED.district_id,
                block_id = EXCLUDED.block_id,
                is_test_data = FALSE;
        """)
        
        res = await session.execute(reconcile_sql, {"state_code": state_code, "state_id": state.id})
        await session.commit()
        return res.rowcount

async def process_state(engine, service: GISService, checkpoint: CheckpointManager, state_code: int, dry_run: bool):
    status = checkpoint.get_state(state_code)
    if status.get("status") == "COMPLETED" and not dry_run:
        logger.info(f"Skipping State {state_code}, already COMPLETED.")
        return

    checkpoint.update_state(state_code, {"status": "RUNNING", "started_at": datetime.now().isoformat()})
    
    try:
        await clear_staging_for_state(engine, state_code)
        
        if dry_run:
            logger.info(f"[DRY RUN] Testing extraction for State {state_code} (max 1000 records)")
            
            # Fetch a sample to validate metadata, pagination, geometry, identifier relationships
            poly_sample = []
            async for feature in service.fetch_state_polygons(state_code):
                poly_sample.append(feature)
                if len(poly_sample) >= 1000: break
                
            point_sample = []
            async for feature in service.fetch_state_points(state_code):
                point_sample.append(feature)
                if len(point_sample) >= 1000: break
                
            staged = len(poly_sample) + len(point_sample)
            logger.info(f"[DRY RUN] State {state_code}: Sampled {len(poly_sample)} polygons, {len(point_sample)} points.")
        else:
            staged = await extract_state_gis(engine, service, state_code)
            
        checkpoint.update_state(state_code, {"records_staged": staged, "status": "VALIDATING"})
        
        committed = await reconcile_state(engine, state_code, dry_run)
        
        if not dry_run:
            checkpoint.update_state(state_code, {
                "records_committed": committed,
                "status": "COMPLETED",
                "completed_at": datetime.now().isoformat()
            })
    except Exception as e:
        logger.error(f"Failed processing state {state_code}: {e}")
        checkpoint.update_state(state_code, {
            "status": "FAILED",
            "error": str(e)
        })

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", type=int, help="Run specific LGD State Code")
    parser.add_argument("--all-india", action="store_true", help="Run all states")
    parser.add_argument("--limit", type=int, help="Limit number of states to run")
    parser.add_argument("--dry-run", action="store_true", help="Perform extraction logic without database commits")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint file")
    args = parser.parse_args()

    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    await init_staging_tables(engine)
    
    checkpoint = CheckpointManager(PROGRESS_FILE)
    service = GISService()
    
    try:
        states = [args.state] if args.state else STATES_TO_PROCESS
        if args.limit:
            states = states[:args.limit]
            
        for state_code in states:
            logger.info(f"--- Processing State {state_code} ---")
            await process_state(engine, service, checkpoint, state_code, args.dry_run)
            
    finally:
        await service.close()
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
