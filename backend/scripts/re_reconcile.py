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
from scripts.national_gis_rollout import STATES_TO_PROCESS, reconcile_state

async def main():
    engine = create_async_engine(settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))
    for state_code in STATES_TO_PROCESS:
        print(f"Re-reconciling state {state_code}...")
        try:
            await reconcile_state(engine, state_code, False)
        except Exception as e:
            print(f"Error on state {state_code}: {e}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
