"""
validate_national_gis.py — Validates the integrity of the National GIS database.
"""

import asyncio
import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.config import settings

async def validate():
    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    
    async with engine.connect() as conn:
        print("--- NATIONAL GIS VALIDATION ---")
        
        # 1. Total imported Panchayats
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats WHERE is_test_data = false"))
        print(f"Total Imported Panchayats: {res.scalar()}")
        
        # 2. LGD Uniqueness (Should be 0 duplicates)
        res = await conn.execute(text("""
            SELECT lgd_code, COUNT(*) 
            FROM panchayats 
            GROUP BY lgd_code 
            HAVING COUNT(*) > 1
        """))
        dupes = res.fetchall()
        print(f"LGD Duplicate Violations: {len(dupes)}")
        
        # 3. Geometry Availability
        res = await conn.execute(text("""
            SELECT geometry_status, COUNT(*) 
            FROM panchayats 
            WHERE is_test_data = false 
            GROUP BY geometry_status
        """))
        print("Geometry Status Breakdown:")
        for row in res:
            print(f"  {row[0]}: {row[1]}")
            
        # 4. Weather Status
        res = await conn.execute(text("""
            SELECT weather_status, COUNT(*) 
            FROM panchayats 
            WHERE is_test_data = false 
            GROUP BY weather_status
        """))
        print("Weather Status Breakdown:")
        for row in res:
            print(f"  {row[0]}: {row[1]}")
            
        # 5. Invalid Coordinates (outside India approx bounding box: Lat 6-38, Lon 68-98)
        res = await conn.execute(text("""
            SELECT COUNT(*) 
            FROM panchayats 
            WHERE is_test_data = false 
            AND (latitude < 6 OR latitude > 38 OR longitude < 68 OR longitude > 98)
            AND latitude IS NOT NULL
        """))
        print(f"Out of Bounds Coordinates: {res.scalar()}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(validate())
