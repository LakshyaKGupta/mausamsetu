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
    async with engine.connect() as c:
        print("Updating District Centroids...")
        await c.execute(text("""
            UPDATE districts SET 
                lat = sub.alat, 
                lon = sub.alon 
            FROM (
                SELECT district_id, AVG(latitude) as alat, AVG(longitude) as alon 
                FROM panchayats 
                GROUP BY district_id
            ) sub 
            WHERE districts.id = sub.district_id;
        """))
        await c.commit()
        print("Done!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
