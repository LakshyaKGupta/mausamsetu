import asyncio
import aiohttp
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def get_state_from_openmeteo(session, district_name):
    query = district_name.replace(" District", "").replace(" Urban", "").replace(" Rural", "")
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=1&language=en&format=json"
    try:
        async with session.get(url) as r:
            data = await r.json()
            results = data.get('results', [])
            if results:
                for res in results:
                    if res.get('country_code') == 'IN':
                        return res.get('admin1')
                return results[0].get('admin1')
    except Exception as e:
        print(f"Error querying {district_name}: {e}")
    return None

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    
    official_states = {
        "andaman and nicobar islands": 35, "andhra pradesh": 28, "arunachal pradesh": 12,
        "assam": 18, "bihar": 10, "chandigarh": 4, "chhattisgarh": 22,
        "dadra and nagar haveli and daman and diu": 38, "delhi": 7, "goa": 30,
        "gujarat": 24, "haryana": 6, "himachal pradesh": 2, "jammu and kashmir": 1,
        "jharkhand": 20, "karnataka": 29, "kerala": 32, "ladakh": 37,
        "lakshadweep": 31, "madhya pradesh": 23, "maharashtra": 27, "manipur": 14,
        "meghalaya": 17, "mizoram": 15, "nagaland": 13, "odisha": 21, "puducherry": 34,
        "punjab": 3, "rajasthan": 8, "sikkim": 11, "tamil nadu": 33,
        "telangana": 36, "tripura": 16, "uttar pradesh": 9, "uttarakhand": 5, "west bengal": 19
    }
    
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT id, name FROM districts;"))
        districts = [{"id": r[0], "name": r[1]} for r in res]
        
        res = await conn.execute(text("SELECT id, name, lgd_code FROM states;"))
        true_states = {r[1].lower(): {"id": r[0], "lgd": r[2]} for r in res}
        lgd_to_id = {r[2]: r[0] for r in res}
        
    district_to_state_id = {}
    
    async with aiohttp.ClientSession() as session:
        batch_size = 50
        for i in range(0, len(districts), batch_size):
            batch = districts[i:i+batch_size]
            tasks = [get_state_from_openmeteo(session, d['name']) for d in batch]
            results = await asyncio.gather(*tasks)
            
            for d, state_name in zip(batch, results):
                if state_name:
                    state_lower = state_name.lower()
                    matched_id = None
                    if state_lower in true_states:
                        matched_id = true_states[state_lower]['id']
                    else:
                        # Handle known aliases
                        if state_lower == 'andaman and nicobar islands' and 'andaman & nicobar' in true_states:
                            matched_id = true_states['andaman & nicobar']['id']
                        elif state_lower == 'dadra and nagar haveli and daman and diu' and 'dadra,nagar haveli,daman & diu' in true_states:
                            matched_id = true_states['dadra,nagar haveli,daman & diu']['id']
                        elif state_lower == 'odisha' and 'orissa' in true_states:
                            matched_id = true_states['orissa']['id']
                        elif state_lower == 'nct of delhi' and 'delhi' in true_states:
                            matched_id = true_states['delhi']['id']
                            
                    if not matched_id:
                        # State name not found in DB! Look up its LGD from official dictionary
                        lgd = official_states.get(state_lower)
                        if lgd and lgd in lgd_to_id:
                            matched_id = lgd_to_id[lgd]
                            
                    if matched_id:
                        district_to_state_id[d['id']] = matched_id
                    else:
                        print(f"Failed to map state '{state_name}' for district {d['name']}")
                else:
                    print(f"No API results for {d['name']}")
                    
    print("Mapping complete. Applying to database...")
    async with engine.begin() as conn:
        if district_to_state_id:
            items = list(district_to_state_id.items())
            chunk_size = 100
            updated = 0
            for j in range(0, len(items), chunk_size):
                chunk = items[j:j+chunk_size]
                cases = " ".join([f"WHEN id = {d_id} THEN {s_id}" for d_id, s_id in chunk])
                ids = ",".join([str(d_id) for d_id, s_id in chunk])
                query = text(f"""
                    UPDATE districts 
                    SET state_id = CASE {cases} END
                    WHERE id IN ({ids})
                """)
                res = await conn.execute(query)
                updated += res.rowcount
            print(f"Updated {updated} districts.")
            
            print("Now updating Panchayats...")
            res = await conn.execute(text("""
                UPDATE panchayats
                SET state_id = districts.state_id
                FROM districts
                WHERE panchayats.district_id = districts.id
            """))
            print(f"Updated {res.rowcount} Panchayats.")
            
            # Optionally update state names
            for sname, lgd in official_states.items():
                if lgd in lgd_to_id:
                    await conn.execute(text(f"UPDATE states SET name = '{sname.title()}' WHERE lgd_code = {lgd} AND name ILIKE 'State %';"))
            
asyncio.run(main())
