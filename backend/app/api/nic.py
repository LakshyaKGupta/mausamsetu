from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
import httpx
import json

router = APIRouter()

GIS_BASE = "https://grammanchitragis.nic.in/grammanchitra/rest/services/panchayat/adminpanch/MapServer"
BHARATMAPS_BASE = "https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer"

@router.get("/nic/query")
async def proxy_nic_query(
    layer_id: int,
    where: str,
    outFields: str,
    returnGeometry: bool = False,
    is_bharatmaps: bool = False,
    f: str = "json"
):
    base_url = BHARATMAPS_BASE if is_bharatmaps else GIS_BASE
    url = f"{base_url}/{layer_id}/query"
    params = {
        "where": where,
        "outFields": outFields,
        "returnGeometry": "true" if returnGeometry else "false",
        "outSR": "4326",
        "f": f
    }
    
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return JSONResponse(content=response.json())
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")
