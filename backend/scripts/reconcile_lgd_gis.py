"""
reconcile_lgd_gis.py — Reconcile Staged GIS data with LGD Administrative Master Data.
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings
from app.models.location import State, District, Block, Panchayat

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

async def reconcile_state(engine, state_code: int):
    logger.info(f"Reconciling GIS data for state code {state_code}...")
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        # We will iterate through staging polygons and points, and merge them into the panchayats table.
        # Since we might not have a complete LGD dump yet, we'll auto-create missing hierarchy for the sake of progress.
        
        # Ensure State exists
        state = await session.execute(select(State).filter_by(lgd_code=state_code))
        state = state.scalar_one_or_none()
        if not state:
            state = State(lgd_code=state_code, name=f"State {state_code}", source="GIS_RECONCILIATION")
            session.add(state)
            await session.commit()
            
        # Execute reconciliation via raw SQL for performance
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
                lgd_code, name, state_id, geometry, latitude, longitude, 
                geometry_source, coordinate_source, geometry_status, is_test_data
            )
            SELECT 
                m.lgd_code,
                m.name,
                :state_id,
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
                FALSE
            FROM merged_gis m
            ON CONFLICT (lgd_code) DO UPDATE SET
                geometry = EXCLUDED.geometry,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                geometry_source = EXCLUDED.geometry_source,
                coordinate_source = EXCLUDED.coordinate_source,
                geometry_status = EXCLUDED.geometry_status,
                name = EXCLUDED.name,
                is_test_data = FALSE;
        """)
        
        res = await session.execute(reconcile_sql, {"state_code": state_code, "state_id": state.id})
        await session.commit()
        logger.info(f"Reconciliation complete. Affected rows: {res.rowcount}")

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state-code", type=int, help="LGD State Code (e.g. 27 for Maharashtra)")
    args = parser.parse_args()

    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    
    try:
        if args.state_code:
            await reconcile_state(engine, args.state_code)
        else:
            parser.print_help()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
