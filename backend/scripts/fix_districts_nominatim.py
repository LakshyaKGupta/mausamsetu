import asyncio
import httpx
import time
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(str(settings.DATABASE_URL))
    
    # Get 1 district LGD for each shifted ST_LGD
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT st_lgd, MIN(dt_lgd) FROM staging_gis_polygons WHERE st_lgd IS NOT NULL GROUP BY st_lgd;"))
        st_to_dist = {r[0]: r[1] for r in res}
        
        # Get district names
        dist_lgds = tuple(st_to_dist.values())
        res = await conn.execute(text(f"SELECT lgd_code, name FROM districts WHERE lgd_code IN {dist_lgds};"))
        dist_names = {r[0]: r[1] for r in res}
        
        # Get all true states
        res = await conn.execute(text("SELECT id, name FROM states;"))
        true_states = {r[1].lower(): r[0] for r in res}
        
    print(f"Found {len(st_to_dist)} st_lgds to map.")
    
    st_lgd_to_true_state_id = {}
    
    async with httpx.AsyncClient() as client:
        for st_lgd, dt_lgd in st_to_dist.items():
            dname = dist_names.get(dt_lgd)
            if not dname:
                continue
                
            # Query Nominatim
            try:
                url = f"https://nominatim.openstreetmap.org/search?county={dname}&country=India&format=json"
                r = await client.get(url, headers={"User-Agent": "GramWeather/1.0"})
                data = r.json()
                if data:
                    display_name = data[0].get("display_name", "")
                    parts = [p.strip().lower() for p in display_name.split(",")]
                    
                    # Find which true state matches
                    matched_id = None
                    for part in parts:
                        if part in true_states:
                            matched_id = true_states[part]
                            break
                        # Handle aliases
                        if part == 'andaman and nicobar islands' and 'andaman & nicobar' in true_states:
                            matched_id = true_states['andaman & nicobar']
                        if part == 'dadra and nagar haveli and daman and diu' and 'dadra,nagar haveli,daman & diu' in true_states:
                            matched_id = true_states['dadra,nagar haveli,daman & diu']
                        if part == 'odisha' and 'orissa' in true_states:
                            matched_id = true_states['orissa']
                    
                    if matched_id:
                        st_lgd_to_true_state_id[st_lgd] = matched_id
                        print(f"Mapped st_lgd {st_lgd} -> {dname} -> True State ID {matched_id}")
                    else:
                        print(f"Could not match state for {dname}: {display_name}")
                else:
                    print(f"No Nominatim results for {dname}")
            except Exception as e:
                print(f"Error on {dname}: {e}")
            
            time.sleep(1.2) # Rate limit
            
    print("Mapping complete. Applying to database...")
    async with engine.begin() as conn:
        for st_lgd, state_id in st_lgd_to_true_state_id.items():
            # Update all districts that belong to this st_lgd in staging
            query = text("""
                UPDATE districts 
                SET state_id = :state_id 
                WHERE lgd_code IN (
                    SELECT dt_lgd FROM staging_gis_polygons WHERE st_lgd = :st_lgd
                    UNION
                    SELECT dt_lgd FROM staging_gis_points WHERE st_lgd = :st_lgd
                )
            """)
            res = await conn.execute(query, {"state_id": state_id, "st_lgd": st_lgd})
            print(f"Updated {res.rowcount} districts for st_lgd {st_lgd} to true state {state_id}")

asyncio.run(main())
