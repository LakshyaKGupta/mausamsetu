import sys
import os
import asyncio

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine
from app.models.officer_ops import FieldReport, AdvisoryAudit
from app.models.advisory import Advisory
from app.database.base import Base

async def init_models():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Done!")

if __name__ == "__main__":
    asyncio.run(init_models())
