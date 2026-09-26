import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_1_maharashtra_districts(async_client: AsyncClient):
    response = await async_client.get("/api/states")
    assert response.status_code == 200
    states = response.json()
    maha = next((s for s in states if s["name"].lower() == "maharashtra"), None)
    
    response = await async_client.get(f"/api/states/{maha['id']}/districts")
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) > 0
    
    forbidden_names = ["kurnool", "bagalkot", "dakshina kannada", "anantapur", "guntur"]
    for d in districts:
        assert d["name"].lower() not in forbidden_names, f"Forbidden district {d['name']} found in Maharashtra!"

@pytest.mark.asyncio
async def test_2_karnataka_districts(async_client: AsyncClient):
    response = await async_client.get("/api/states")
    states = response.json()
    karna = next((s for s in states if s["name"].lower() == "karnataka"), None)
    
    response = await async_client.get(f"/api/states/{karna['id']}/districts")
    assert response.status_code == 200
    districts = response.json()
    assert len(districts) > 0
    
    has_bagalkot = any(d["name"].lower() == "bagalkot" for d in districts)
    assert has_bagalkot, "Bagalkot district should be in Karnataka"

@pytest.mark.asyncio
async def test_3_maharashtra_blocks(async_client: AsyncClient):
    response = await async_client.get("/api/states")
    maha = next(s for s in response.json() if s["name"].lower() == "maharashtra")
    
    response = await async_client.get(f"/api/states/{maha['id']}/districts")
    districts = response.json()
    pune = next(d for d in districts if d["name"].lower() == "pune")
    
    response = await async_client.get(f"/api/districts/{pune['id']}/blocks")
    assert response.status_code == 200
    blocks = response.json()
    assert len(blocks) > 0

@pytest.mark.asyncio
async def test_4_block_panchayats(async_client: AsyncClient):
    response = await async_client.get("/api/states")
    maha = next(s for s in response.json() if s["name"].lower() == "maharashtra")
    
    response = await async_client.get(f"/api/states/{maha['id']}/districts")
    districts = response.json()
    pune = next(d for d in districts if d["name"].lower() == "pune")
    
    response = await async_client.get(f"/api/districts/{pune['id']}/blocks")
    blocks = response.json()
    first_block = blocks[0]
    
    response = await async_client.get(f"/api/blocks/{first_block['id']}/panchayats")
    assert response.status_code == 200
    panchayats = response.json()
    assert len(panchayats) > 0
