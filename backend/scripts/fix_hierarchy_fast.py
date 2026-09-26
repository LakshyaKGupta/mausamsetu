import asyncio
import aiohttp
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.models.location import State, District, Block, Panchayat
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer"

async def fetch_layer(session, layer_id, total_records=None, batch_size=1000):
    logger.info(f"Fetching Layer {layer_id}...")
    
    # First get the count if not known
    if total_records is None:
        url = f"{BASE_URL}/{layer_id}/query?where=1=1&returnCountOnly=true&f=json"
        async with session.get(url, ssl=False) as r:
            data = await r.json()
            total_records = data.get('count', 0)
    
    logger.info(f"Layer {layer_id} has {total_records} records.")
    
    offsets = range(0, total_records, batch_size)
    all_features = []
    
    async def fetch_page(offset):
        url = f"{BASE_URL}/{layer_id}/query?where=1=1&outFields=*&returnGeometry=false&f=json&resultOffset={offset}&resultRecordCount={batch_size}"
        try:
            async with session.get(url, ssl=False) as r:
                data = await r.json()
                return data.get('features', [])
        except Exception as e:
            logger.error(f"Error at offset {offset}: {e}")
            return []

    # Run in batches of 10 to not overwhelm the server
    for i in range(0, len(offsets), 20):
        tasks = [fetch_page(o) for o in offsets[i:i+20]]
        results = await asyncio.gather(*tasks)
        for res in results:
            all_features.extend(res)
        logger.info(f"Fetched {len(all_features)}/{total_records} for layer {layer_id}")
        await asyncio.sleep(0.5)

    return all_features

async def fix_hierarchy():
    engine = create_async_engine(str(settings.DATABASE_URL))
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with aiohttp.ClientSession() as session:
        # Districts
        districts_data = await fetch_layer(session, 1)
        dist_to_state_lgd = {}
        for f in districts_data:
            attr = f.get('attributes', {})
            d_lgd = attr.get('Dist_LGD')
            s_lgd = attr.get('State_LGD')
            if d_lgd and s_lgd:
                dist_to_state_lgd[int(d_lgd)] = int(s_lgd)

        # Blocks
        blocks_data = await fetch_layer(session, 2)
        block_to_dist_lgd = {}
        for f in blocks_data:
            attr = f.get('attributes', {})
            b_lgd = attr.get('block_lgd')
            d_lgd = attr.get('Dist_LGD')
            if b_lgd and d_lgd:
                block_to_dist_lgd[int(b_lgd)] = int(d_lgd)

        # Panchayats
        panchayats_data = await fetch_layer(session, 3)
        gp_to_block_lgd = {}
        for f in panchayats_data:
            attr = f.get('attributes', {})
            gp_code = attr.get('GPCODE') or attr.get('VILCODE11')
            b_lgd = attr.get('blklgdcode')
            if gp_code and b_lgd:
                gp_to_block_lgd[int(gp_code)] = int(b_lgd)

    logger.info(f"Mappings fetched: {len(dist_to_state_lgd)} dists, {len(block_to_dist_lgd)} blocks, {len(gp_to_block_lgd)} GPs")

    async with AsyncSessionLocal() as db:
        # DB Updates
        logger.info("Loading internal DB IDs...")
        states = await db.execute(select(State.id, State.lgd_code))
        state_lgd_to_id = {row.lgd_code: row.id for row in states if row.lgd_code}

        districts = await db.execute(select(District.id, District.lgd_code))
        dist_lgd_to_id = {row.lgd_code: row.id for row in districts if row.lgd_code}

        blocks = await db.execute(select(Block.id, Block.lgd_code))
        block_lgd_to_id = {row.lgd_code: row.id for row in blocks if row.lgd_code}

        logger.info("Fixing Districts...")
        updated_dists = 0
        for d_lgd, s_lgd in dist_to_state_lgd.items():
            if s_lgd in state_lgd_to_id:
                res = await db.execute(update(District).where(District.lgd_code == d_lgd).values(state_id=state_lgd_to_id[s_lgd]))
                updated_dists += res.rowcount
        await db.commit()
        logger.info(f"Fixed {updated_dists} Districts.")

        logger.info("Fixing Blocks...")
        updated_blocks = 0
        for b_lgd, d_lgd in block_to_dist_lgd.items():
            if d_lgd in dist_lgd_to_id:
                res = await db.execute(update(Block).where(Block.lgd_code == b_lgd).values(district_id=dist_lgd_to_id[d_lgd]))
                updated_blocks += res.rowcount
        await db.commit()
        logger.info(f"Fixed {updated_blocks} Blocks.")

        logger.info("Fixing Panchayats...")
        updated_gps = 0
        for gp_code, b_lgd in gp_to_block_lgd.items():
            if b_lgd in block_lgd_to_id:
                res = await db.execute(update(Panchayat).where(Panchayat.lgd_code == gp_code).values(block_id=block_lgd_to_id[b_lgd]))
                updated_gps += res.rowcount
        await db.commit()
        logger.info(f"Fixed {updated_gps} Panchayats.")

if __name__ == "__main__":
    asyncio.run(fix_hierarchy())
