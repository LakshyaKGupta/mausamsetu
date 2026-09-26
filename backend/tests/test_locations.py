import pytest
from httpx import AsyncClient, ASGITransport
import asyncio
from app.main import app

@pytest.mark.asyncio
async def test_location_hierarchy():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Get states
        response = await client.get("/api/states")
        assert response.status_code == 200
        states = response.json()
        assert len(states) > 0
        state_id = states[0]["id"]
        
        # Get districts
        response = await client.get(f"/api/states/{state_id}/districts")
        assert response.status_code == 200
        districts = response.json()
        assert len(districts) > 0
        district_id = districts[0]["id"]
        
        # Get blocks
        response = await client.get(f"/api/districts/{district_id}/blocks")
        assert response.status_code == 200
        blocks = response.json()
        assert len(blocks) > 0
        block_id = blocks[0]["id"]
        
        # Get panchayats
        response = await client.get(f"/api/blocks/{block_id}/panchayats")
        assert response.status_code == 200
        panchayats = response.json()
        assert len(panchayats) > 0
        panchayat_id = panchayats[0]["id"]
        
        # Get geometry
        response = await client.get(f"/api/panchayat/{panchayat_id}/geometry")
        assert response.status_code == 200
        feature = response.json()
        assert feature["type"] == "Feature"
        assert "geometry" in feature
        assert feature["geometry"]["type"] == "Point"

@pytest.mark.asyncio
async def test_invalid_location_id():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/states/9999/districts")
        assert response.status_code == 404
        
        response = await client.get("/api/districts/9999/blocks")
        assert response.status_code == 404
        
        response = await client.get("/api/blocks/9999/panchayats")
        assert response.status_code == 404
        
        response = await client.get("/api/panchayat/9999/geometry")
        assert response.status_code == 404
