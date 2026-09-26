import asyncio
import argparse
import pandas as pd
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.models.location import State, District, Block, Panchayat
from app.core.config import settings
import os

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def process_file(file_path: str, state_filter: str):
    print(f"Starting ingestion from {file_path} for state {state_filter}...")
    
    # Attempt to read as CSV (with fallback to Excel if needed)
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith('.xls') or file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        else:
            print("Unsupported file format. Please provide .csv or .xls/xlsx")
            return
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Normalizing column names for robust parsing
    df.columns = [str(c).strip().lower().replace(" ", "_").replace(".", "") for c in df.columns]
    
    # Expected columns (these will likely need to be adjusted based on the actual LGD export format)
    col_mapping = {
        'state_name': ['state_name', 'state name', 'state'],
        'state_lgd_code': ['state_code', 'state code', 'state_lgd_code'],
        'district_name': ['district_name', 'district name', 'district'],
        'district_lgd_code': ['district_code', 'district code', 'district_lgd_code'],
        'block_name': ['block_name', 'block name', 'sub_district_name', 'sub-district name', 'subdistrict'],
        'block_lgd_code': ['block_code', 'block code', 'sub_district_code', 'sub_district_lgd_code'],
        'panchayat_name': ['local_body_name', 'gram_panchayat_name', 'panchayat_name', 'village_panchayat_name'],
        'panchayat_lgd_code': ['local_body_code', 'local_body_lgd_code', 'gram_panchayat_code', 'panchayat_code'],
        'local_body_type': ['local_body_type', 'local_body_type_name'],
        'lat': ['latitude', 'lat'],
        'lon': ['longitude', 'lon', 'long']
    }

    def find_col(possible_names):
        for c in df.columns:
            if c in possible_names:
                return c
        return None

    state_col = find_col(col_mapping['state_name'])
    state_code_col = find_col(col_mapping['state_lgd_code'])
    dist_col = find_col(col_mapping['district_name'])
    dist_code_col = find_col(col_mapping['district_lgd_code'])
    block_col = find_col(col_mapping['block_name'])
    block_code_col = find_col(col_mapping['block_lgd_code'])
    panchayat_col = find_col(col_mapping['panchayat_name'])
    panchayat_code_col = find_col(col_mapping['panchayat_lgd_code'])
    type_col = find_col(col_mapping['local_body_type'])
    lat_col = find_col(col_mapping['lat'])
    lon_col = find_col(col_mapping['lon'])

    # Validate minimal columns exist
    if not all([state_col, dist_col, panchayat_col, panchayat_code_col]):
        print(f"Error: Missing required columns in dataset. Found columns: {df.columns.tolist()}")
        print("We need at least State, District, Panchayat name, and Panchayat LGD code.")
        return

    # Filter by state
    if state_filter:
        df = df[df[state_col].astype(str).str.contains(state_filter, case=False, na=False)]

    records_read = len(df)
    records_inserted = 0
    records_updated = 0
    invalid_records = 0
    missing_geography = 0

    print(f"Found {records_read} records for {state_filter}.")

    async with AsyncSessionLocal() as session:
        for idx, row in df.iterrows():
            try:
                state_name = str(row[state_col]).strip()
                dist_name = str(row[dist_col]).strip()
                block_name = str(row[block_col]).strip() if block_col and pd.notna(row[block_col]) else "Unknown Block"
                p_name = str(row[panchayat_col]).strip()
                p_code = int(row[panchayat_code_col]) if pd.notna(row[panchayat_code_col]) else None
                
                if not p_code:
                    invalid_records += 1
                    continue

                lat = float(row[lat_col]) if lat_col and pd.notna(row[lat_col]) else None
                lon = float(row[lon_col]) if lon_col and pd.notna(row[lon_col]) else None
                
                body_type = str(row[type_col]).strip() if type_col and pd.notna(row[type_col]) else "Gram Panchayat"
                
                # Fetch or create State
                result = await session.execute(select(State).filter(State.name == state_name))
                state_obj = result.scalars().first()
                if not state_obj:
                    state_code = int(row[state_code_col]) if state_code_col and pd.notna(row[state_code_col]) else None
                    state_obj = State(name=state_name, lgd_code=state_code)
                    session.add(state_obj)
                    await session.commit()
                    await session.refresh(state_obj)

                # Fetch or create District
                result = await session.execute(select(District).filter(District.name == dist_name, District.state_id == state_obj.id))
                dist_obj = result.scalars().first()
                if not dist_obj:
                    dist_code = int(row[dist_code_col]) if dist_code_col and pd.notna(row[dist_code_col]) else None
                    dist_obj = District(name=dist_name, state_id=state_obj.id, lgd_code=dist_code)
                    session.add(dist_obj)
                    await session.commit()
                    await session.refresh(dist_obj)

                # Fetch or create Block
                result = await session.execute(select(Block).filter(Block.name == block_name, Block.district_id == dist_obj.id))
                block_obj = result.scalars().first()
                if not block_obj:
                    block_code = int(row[block_code_col]) if block_code_col and pd.notna(row[block_code_col]) else None
                    block_obj = Block(name=block_name, district_id=dist_obj.id, lgd_code=block_code)
                    session.add(block_obj)
                    await session.commit()
                    await session.refresh(block_obj)

                # Fetch or update Panchayat
                result = await session.execute(select(Panchayat).filter(Panchayat.lgd_code == p_code))
                p_obj = result.scalars().first()
                
                data_status = "GEOGRAPHY_UNAVAILABLE" if lat is None or lon is None else "OK"
                geometry_val = f"SRID=4326;POINT({lon} {lat})" if lat and lon else None
                
                if lat is None or lon is None:
                    missing_geography += 1

                if not p_obj:
                    p_obj = Panchayat(
                        name=p_name,
                        lgd_code=p_code,
                        block_id=block_obj.id,
                        local_body_type=body_type,
                        lat=lat,
                        lon=lon,
                        geometry=geometry_val,
                        geometry_source="LGD File" if lat else None,
                        source_url="Provided File",
                        source_updated_at=datetime.now(),
                        data_status=data_status,
                        is_test_data=False
                    )
                    session.add(p_obj)
                    records_inserted += 1
                else:
                    p_obj.name = p_name
                    p_obj.block_id = block_obj.id
                    p_obj.local_body_type = body_type
                    if lat and lon:
                        p_obj.lat = lat
                        p_obj.lon = lon
                        p_obj.geometry = geometry_val
                        p_obj.geometry_source = "LGD File"
                    p_obj.source_updated_at = datetime.now()
                    p_obj.data_status = data_status
                    p_obj.is_test_data = False
                    records_updated += 1
                
                # Commit every 500 rows to save memory and handle batches
                if (records_inserted + records_updated) % 500 == 0:
                    await session.commit()

            except Exception as e:
                print(f"Error processing row {idx}: {e}")
                invalid_records += 1
        
        await session.commit()

    # Generate Report
    report_content = f"""# LGD Ingestion Report

- **Timestamp**: {datetime.now(timezone.utc).isoformat()}
- **State Filter**: {state_filter}
- **Source File**: {file_path}

## Statistics
- **Records Read**: {records_read}
- **Records Inserted**: {records_inserted}
- **Records Updated**: {records_updated}
- **Invalid Records**: {invalid_records}
- **Missing Geography**: {missing_geography}
"""
    
    os.makedirs('../experiments/official_data', exist_ok=True)
    with open('../experiments/official_data/lgd_ingestion_report.md', 'w') as f:
        f.write(report_content)
        
    print("\nIngestion Complete. Report saved to experiments/official_data/lgd_ingestion_report.md")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest official LGD panchayats from a dataset file.")
    parser.add_argument("--file", type=str, required=True, help="Path to the official LGD CSV/XLS file")
    parser.add_argument("--state", type=str, help="State filter (e.g. MH or Maharashtra)")
    args = parser.parse_args()
    
    asyncio.run(process_file(args.file, args.state))
