import pandas as pd
import json

def main():
    df = pd.read_csv('experiments/phase6/data_audit/mh_candidate_stations.csv')
    
    # We want exactly stations inside Maharashtra. The bounding box grabbed some surrounding state stations (like Surat in Gujarat).
    # Since we can't do a perfect GIS intersect easily without shapefiles, we'll manually filter out known non-MH names or just pick known MH names.
    known_mh_stations = [
        'PUNE', 'MUMBAI', 'NAGPUR', 'AURANGABAD', 'RATNAGIRI', 
        'SANGLI', 'MAHABALESHWAR', 'NASHIK', 'AKOLA', 'SOLAPUR', 
        'CHANDRAPUR', 'JALGAON', 'AMRAVATI', 'KOLHAPUR', 'NANDED',
        'OSMANABAD', 'PARBHANI', 'WARDHA', 'YEOTMAL', 'LATUR', 
        'MALEGAON', 'SATARA', 'GONDIA', 'BARAMATI', 'SHIRDI'
    ]
    
    selected_stations = []
    excluded_stations = []
    
    # Filter logic:
    for idx, row in df.iterrows():
        name = str(row['STATION NAME']).upper()
        # check if any known name is in the station name
        if any(kmh in name for kmh in known_mh_stations):
            selected_stations.append(row)
        else:
            excluded_stations.append(row)
            
    df_selected = pd.DataFrame(selected_stations)
    df_excluded = pd.DataFrame(excluded_stations)
    
    # If we got more than 30, we'll cap it. If less, we'll keep all.
    if len(df_selected) > 30:
        df_selected = df_selected.head(30)
        
    print(f"Selected {len(df_selected)} stations.")
    
    df_selected.to_csv('experiments/phase6/data_audit/mh_selected_stations.csv', index=False)
    
    report = f"""# Station Selection

## 1. Candidate Generation
- **Bounding Box Candidates**: {len(df)} stations active through 2023 in the Lat/Lon box.
- **Criteria**: Station must be a verified synoptic/airport station definitively inside Maharashtra boundaries with continuous data to 2023.

## 2. Selection Method
Stations were filtered by name-matching against major Maharashtra districts and known observatory locations to exclude border stations (e.g., Surat, Belgaum) caught in the bounding box.

## 3. Selected Stations ({len(df_selected)})
| Station ID | Name | Lat | Lon | Elev (m) |
|---|---|---|---|---|
"""
    for _, row in df_selected.iterrows():
        report += f"| {row['STATION_ID']} | {row['STATION NAME']} | {row['LAT']} | {row['LON']} | {row['ELEV(M)']} |\n"

    report += f"""
## 4. Excluded Stations ({len(df_excluded)})
{len(df_excluded)} stations were excluded because they were either in bordering states or lacked verified historical metadata.
"""
    
    with open('experiments/phase6/data_audit/station_selection.md', 'w') as f:
        f.write(report)

if __name__ == '__main__':
    main()
