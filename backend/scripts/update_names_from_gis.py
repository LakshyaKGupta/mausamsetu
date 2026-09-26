import asyncio
import json
import logging
import requests
import warnings
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' can be imported
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Suppress insecure request warnings for mapservice.gov.in
from urllib3.exceptions import InsecureRequestWarning
warnings.simplefilter('ignore', InsecureRequestWarning)

from sqlalchemy import select, update, or_
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models.location import State, District, Block, Panchayat
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Base URL for Gram Manchitra MapServer
BASE_URL = "https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer"

async def update_names():
    engine = create_async_engine(str(settings.DATABASE_URL))
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    def fetch_all(layer_id):
        offset = 0
        count = 1000
        all_features = []
        while True:
            url = f"{BASE_URL}/{layer_id}/query?where=1=1&outFields=*&returnGeometry=false&f=json&resultOffset={offset}&resultRecordCount={count}"
            try:
                r = requests.get(url, verify=False)
                data = r.json()
                features = data.get('features', [])
                if not features:
                    break
                all_features.extend(features)
                if len(features) < count:
                    break
                offset += count
            except Exception as e:
                logger.error(f"Error fetching layer {layer_id}: {e}")
                break
        return all_features

    async with AsyncSessionLocal() as db:
        # 1. Update States
        logger.info("Fetching State names from Layer 0...")
        states_data = fetch_all(0)
        updated_states = 0
        for feature in states_data:
            attr = feature.get('attributes', {})
            state_name = attr.get('STNAME')
            state_lgd = attr.get('State_LGD') or attr.get('STCODE11')
            if state_name and state_lgd:
                result = await db.execute(
                    update(State)
                    .where(State.lgd_code == int(state_lgd))
                    .values(name=state_name.strip().title())
                )
                updated_states += result.rowcount
        await db.commit()
        logger.info(f"Updated {updated_states} States.")

        # 2. Update Districts
        logger.info("Fetching District names from Layer 1...")
        districts_data = fetch_all(1)
        updated_districts = 0
        for feature in districts_data:
            attr = feature.get('attributes', {})
            district_name = attr.get('D_Pan_Name') or attr.get('dtname')
            codes = []
            if attr.get('D_Pan_Code'): codes.append(int(attr.get('D_Pan_Code')))
            if attr.get('Dist_LGD'): codes.append(int(attr.get('Dist_LGD')))
            
            if district_name and codes:
                result = await db.execute(
                    update(District)
                    .where(District.lgd_code.in_(codes))
                    .values(name=district_name.strip().title())
                )
                updated_districts += result.rowcount
        await db.commit()
        logger.info(f"Updated {updated_districts} Districts.")

        # 3. Update Blocks
        logger.info("Fetching Block names from Layer 2...")
        blocks_data = fetch_all(2)
        updated_blocks = 0
        for feature in blocks_data:
            attr = feature.get('attributes', {})
            block_name = attr.get('B_Pan_Name') or attr.get('block_name')
            codes = []
            if attr.get('B_Pan_Code'): codes.append(int(attr.get('B_Pan_Code')))
            if attr.get('block_lgd'): codes.append(int(attr.get('block_lgd')))
            
            if block_name and codes:
                result = await db.execute(
                    update(Block)
                    .where(Block.lgd_code.in_(codes))
                    .values(name=block_name.strip().title())
                )
                updated_blocks += result.rowcount
        await db.commit()
        logger.info(f"Updated {updated_blocks} Blocks.")

        # 4. Update Panchayats
        logger.info("Fetching Panchayat names from Layer 3...")
        panchayats_data = fetch_all(3)
        updated_panchayats = 0
        for feature in panchayats_data:
            attr = feature.get('attributes', {})
            panchayat_name = attr.get('GPNAME') or attr.get('VILNAME11')
            codes = []
            if attr.get('GPCODE'): codes.append(int(attr.get('GPCODE')))
            if attr.get('VILCODE11'): codes.append(int(attr.get('VILCODE11')))
            
            if panchayat_name and codes:
                result = await db.execute(
                    update(Panchayat)
                    .where(Panchayat.lgd_code.in_(codes))
                    .values(name=panchayat_name.strip().title())
                )
                updated_panchayats += result.rowcount
        await db.commit()
        logger.info(f"Updated {updated_panchayats} Panchayats.")

if __name__ == "__main__":
    asyncio.run(update_names())
