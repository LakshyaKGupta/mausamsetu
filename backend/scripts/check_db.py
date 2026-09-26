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

async def main():
    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    async with engine.connect() as conn:
        print("--- DB CHECKS ---")
        
        # total records
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats"))
        print(f"Total Panchayat records: {res.scalar()}")
        
        # distinct LGD codes
        res = await conn.execute(text("SELECT COUNT(DISTINCT lgd_code) FROM panchayats"))
        print(f"Distinct LGD codes: {res.scalar()}")
        
        # duplicates
        res = await conn.execute(text("SELECT COUNT(*) FROM (SELECT lgd_code FROM panchayats GROUP BY lgd_code HAVING COUNT(*) > 1) AS dupes"))
        print(f"Duplicate LGD codes: {res.scalar()}")
        
        # geometry_status distribution
        res = await conn.execute(text("SELECT geometry_status, COUNT(*) FROM panchayats GROUP BY geometry_status"))
        print("\nGeometry Status Distribution:")
        for row in res:
            print(f"  {row[0]}: {row[1]}")
            
        # polygon geometry count
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats WHERE geometry IS NOT NULL"))
        print(f"\nPolygon geometry count: {res.scalar()}")
        
        # representative-point count
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats WHERE latitude IS NOT NULL AND longitude IS NOT NULL"))
        print(f"Representative-point count: {res.scalar()}")
        
        # NULL/invalid coordinate count
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats WHERE latitude IS NULL OR longitude IS NULL"))
        print(f"NULL coordinate count: {res.scalar()}")
        
        res = await conn.execute(text("SELECT COUNT(*) FROM panchayats WHERE (latitude < 6 OR latitude > 38 OR longitude < 68 OR longitude > 98) AND latitude IS NOT NULL"))
        print(f"Invalid coordinate count: {res.scalar()}")
        
        # Sample Maharashtra records
        res = await conn.execute(text("SELECT name, lgd_code, geometry_status FROM panchayats WHERE state_id = (SELECT id FROM states WHERE name LIKE '%Maharashtra%' LIMIT 1) LIMIT 3"))
        print("\nSample Maharashtra records:")
        for row in res:
            print(f"  {row[0]} (LGD: {row[1]}, Status: {row[2]})")
            
        # Sample records from other states
        res = await conn.execute(text("""
            SELECT p.name, p.lgd_code, s.name, p.geometry_status 
            FROM panchayats p 
            JOIN states s ON p.state_id = s.id 
            WHERE s.name NOT LIKE '%Maharashtra%' 
            LIMIT 5
        """))
        print("\nSample Non-Maharashtra records:")
        for row in res:
            print(f"  {row[0]} in {row[2]} (LGD: {row[1]}, Status: {row[3]})")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
