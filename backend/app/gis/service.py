import logging
from typing import AsyncGenerator, Dict, Any
from .bharatmaps import BharatMapsClient
from .grammanchitra import GramManchitraClient

logger = logging.getLogger(__name__)

class GISService:
    def __init__(self):
        self.bm_client = BharatMapsClient()
        self.gm_client = GramManchitraClient()

    async def close(self):
        await self.bm_client.close()
        await self.gm_client.close()

    async def fetch_state_polygons(self, state_lgd_code: int) -> AsyncGenerator[Dict[str, Any], None]:
        """Fetch all Gram Panchayat polygons for the state."""
        async for feature in self.bm_client.get_panchayat_polygons(state_lgd_code):
            yield feature
            
    async def fetch_state_points(self, state_lgd_code: int) -> AsyncGenerator[Dict[str, Any], None]:
        """Fetch all Gram Panchayat points for the state."""
        async for feature in self.gm_client.get_panchayat_points(state_lgd_code):
            yield feature

