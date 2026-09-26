import requests
import pandas as pd
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    print("Fetching Wikipedia page...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get('https://en.wikipedia.org/wiki/List_of_districts_in_India', headers=headers)
    tables = pd.read_html(r.text)
    
    district_to_state = {}
    
    # Process all tables. State tables usually have 'District', 'Headquarters', etc.
    for i, df in enumerate(tables):
        # Clean column names
        cols = [str(c).strip().lower() for c in df.columns]
        
        # Identify district column
        dist_col = None
        for c in df.columns:
            if 'district' in str(c).lower() and 'headquarters' not in str(c).lower():
                dist_col = c
                break
                
        if dist_col:
            # Try to infer state from the previous text or table context, but Wikipedia organizes by state headers
            # Actually Wikipedia has 36 tables, one for each state/UT!
            # The state name is not in the table. It is before the table.
            pass
            
    # That might be hard to parse robustly.
    # Alternative: We already mapped the ST_LGD for 24 states!
    # Can we just map the remaining 12 states by looking at their districts?
    
    # We can just fetch all districts from DB and use Nominatim!
    # Yes! Let's do that for the remaining districts that still have the WRONG state_id!
    # Wait, how do we know which districts have the WRONG state_id?
    pass

if __name__ == "__main__":
    asyncio.run(main())
