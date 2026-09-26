import pandas as pd
import requests
import io
import json

def main():
    print("Fetching ISD history...")
    url = "https://www.ncei.noaa.gov/pub/data/noaa/isd-history.csv"
    r = requests.get(url)
    df = pd.read_csv(io.StringIO(r.text))
    
    # Maharashtra roughly: Lat 15.6 to 22.0, Lon 72.6 to 80.9
    # Country = IN (India)
    df_in = df[df['CTRY'] == 'IN'].copy()
    
    # Filter by bounding box for Maharashtra
    df_mh = df_in[(df_in['LAT'] >= 15.6) & (df_in['LAT'] <= 22.0) & 
                  (df_in['LON'] >= 72.6) & (df_in['LON'] <= 80.9)].copy()
                  
    # Filter for stations active in 2023
    df_mh['END'] = pd.to_numeric(df_mh['END'].astype(str).str[:4], errors='coerce')
    df_mh['BEGIN'] = pd.to_numeric(df_mh['BEGIN'].astype(str).str[:4], errors='coerce')
    
    df_mh = df_mh[(df_mh['END'] >= 2023) & (df_mh['BEGIN'] <= 2022)]
    
    # Some known MH stations:
    # 430630: Pune
    # 430030: Mumbai
    # 428670: Nagpur
    # 430140: Aurangabad
    # 430570: Ratnagiri
    # 431100: Sangli
    # 430130: Mahabaleshwar
    # 429210: Nashik
    # 429330: Akola
    # 431170: Solapur
    # 429710: Chandrapur
    # 429090: Jalgaon
    
    df_mh['USAF'] = df_mh['USAF'].astype(str).str.zfill(6)
    df_mh['WBAN'] = df_mh['WBAN'].astype(str).str.zfill(5)
    df_mh['STATION_ID'] = df_mh['USAF'] + df_mh['WBAN']
    
    print(f"Found {len(df_mh)} candidate stations in Maharashtra bounding box active in 2023.")
    print(df_mh[['STATION_ID', 'STATION NAME', 'LAT', 'LON', 'ELEV(M)', 'BEGIN', 'END']])
    
    # Save the candidate stations
    df_mh.to_csv('experiments/phase6/data_audit/mh_candidate_stations.csv', index=False)
    
if __name__ == '__main__':
    main()
