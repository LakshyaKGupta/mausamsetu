import httpx
import json
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional

logger = logging.getLogger(__name__)

class ArcGISClient:
    def __init__(self, base_url: str, ca_bundle_path: Optional[str] = None):
        self.base_url = base_url
        # Use custom CA bundle if provided to satisfy NIC servers missing intermediates
        verify = ca_bundle_path if ca_bundle_path else True
        self.client = httpx.AsyncClient(verify=verify, timeout=60.0)

    async def close(self):
        await self.client.aclose()

    async def query_layer(
        self, 
        layer_id: int, 
        where: str = "1=1", 
        out_fields: str = "*", 
        return_geometry: bool = True,
        batch_size: int = 1000
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream features from an ArcGIS REST layer using pagination (resultOffset).
        """
        url = f"{self.base_url}/{layer_id}/query"
        offset = 0

        while True:
            params = {
                "where": where,
                "outFields": out_fields,
                "returnGeometry": "true" if return_geometry else "false",
                "f": "geojson",
                "resultOffset": offset,
                "resultRecordCount": batch_size
            }
            logger.debug(f"Querying {url} offset={offset}")
            
            # Pacing / Rate Limit
            await asyncio.sleep(0.5) 
            
            retries = 0
            max_retries = 5
            success = False
            data = None
            
            while retries < max_retries and not success:
                try:
                    response = await self.client.get(url, params=params)
                    
                    if response.status_code == 429 or response.status_code >= 500:
                        retries += 1
                        wait_time = 2 ** retries
                        logger.warning(f"HTTP {response.status_code} received. Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                        continue
                        
                    response.raise_for_status()
                    data = response.json()
                    
                    # ArcGIS sometimes returns 200 with an error object inside
                    if "error" in data:
                        logger.error(f"ArcGIS Error: {data['error']}")
                        # Treat as fatal since we don't know if it's transient
                        raise Exception(f"ArcGIS REST Error: {data['error']}")
                        
                    success = True
                    
                except httpx.RequestError as e:
                    retries += 1
                    wait_time = 2 ** retries
                    logger.warning(f"Request error: {e}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
            
            if not success or not data:
                logger.error(f"Failed to query {url} after {max_retries} retries.")
                raise Exception(f"Max retries exceeded for {url}")
                
            features = data.get("features", [])
            
            if not features:
                break
                
            for feature in features:
                yield feature
                
            # Handle exceededTransferLimit according to spec, but we also rely on batch size manually
            if len(features) < batch_size and not data.get("exceededTransferLimit", False):
                break
                
            offset += batch_size
