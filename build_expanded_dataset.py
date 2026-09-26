import os
import requests
import xarray as xr
import pandas as pd
import numpy as np
import csv
from datetime import datetime, timedelta
import concurrent.futures
import json

def fetch_gfs_variables(date_str, cycle, fhour, out_dir="experiments/phase6/data/raw"):
    fhour_str = f"{fhour:03d}"
    out_file = os.path.join(out_dir, f"gfs_{date_str}_{cycle}_{fhour_str}_subset.grib2")
    if os.path.exists(out_file):
        return out_file
        
    base_url = f"https://noaa-gfs-bdp-pds.s3.amazonaws.com/gfs.{date_str}/{cycle}/atmos/gfs.t{cycle}z.pgrb2.0p25.f{fhour_str}"
    idx_url = f"{base_url}.idx"
    try:
        r_idx = requests.get(idx_url, timeout=10)
        if r_idx.status_code != 200:
            return None
    except Exception:
        return None
        
    idx_lines = r_idx.text.split('\n')
    
    tmp_start = None
    tmp_end = None
    hgt_start = None
    hgt_end = None
    
    for i, line in enumerate(idx_lines):
        if not line.strip(): continue
        parts = line.split(':')
        offset = int(parts[1])
        var_name = parts[3]
        level = parts[4]
        
        if var_name == 'TMP' and level == '2 m above ground':
            tmp_start = offset
            if i + 1 < len(idx_lines) and idx_lines[i+1].strip():
                tmp_end = int(idx_lines[i+1].split(':')[1]) - 1
            else:
                tmp_end = ""
        elif var_name == 'HGT' and level == 'surface':
            hgt_start = offset
            if i + 1 < len(idx_lines) and idx_lines[i+1].strip():
                hgt_end = int(idx_lines[i+1].split(':')[1]) - 1
            else:
                hgt_end = ""
                
    if tmp_start is None or hgt_start is None:
        return None
        
    tmp_headers = {"Range": f"bytes={tmp_start}-{tmp_end}"}
    hgt_headers = {"Range": f"bytes={hgt_start}-{hgt_end}"}
    
    try:
        r_tmp = requests.get(base_url, headers=tmp_headers, timeout=10)
        r_hgt = requests.get(base_url, headers=hgt_headers, timeout=10)
        
        if r_tmp.status_code not in (200, 206) or r_hgt.status_code not in (200, 206):
            return None
            
        with open(out_file, 'wb') as f:
            f.write(r_tmp.content)
            f.write(r_hgt.content)
            
        return out_file
    except Exception:
        return None

def fetch_isd_data(station_id, year):
    url = f"https://www.ncei.noaa.gov/data/global-hourly/access/{year}/{station_id}.csv"
    try:
        r = requests.get(url, stream=True, timeout=10)
        if r.status_code != 200:
            return {}
    except Exception:
        return {}
        
    isd_lines = r.text.split('\n')
    obs = {}
    for line in isd_lines[1:]:
        if not line.strip(): continue
        try:
            parts = list(csv.reader([line]))[0]
            date_str = parts[1] # "2023-01-01T00:00:00"
            
            tmp_part = parts[13]
            tmp_val = tmp_part.split(',')[0]
            tmp_qc = tmp_part.split(',')[1] if ',' in tmp_part else '9'
            
            lat = float(parts[3])
            lon = float(parts[4])
            elev = float(parts[5])
            
            if tmp_val != '9999' and tmp_qc in ['1', '5']:
                obs[date_str] = {
                    'temp_c': int(tmp_val) / 10.0,
                    'qc': tmp_qc,
                    'lat': lat,
                    'lon': lon,
                    'elev': elev
                }
        except:
            pass
    return obs

def extract_nodes(da, lat, lon):
    lat0 = np.floor(lat / 0.25) * 0.25
    lat1 = lat0 + 0.25
    lon0 = np.floor(lon / 0.25) * 0.25
    lon1 = lon0 + 0.25
    
    try:
        t00 = float(da.sel(latitude=lat0, longitude=lon0).item()) - 273.15
        t01 = float(da.sel(latitude=lat0, longitude=lon1).item()) - 273.15
        t10 = float(da.sel(latitude=lat1, longitude=lon0).item()) - 273.15
        t11 = float(da.sel(latitude=lat1, longitude=lon1).item()) - 273.15
        return t00, t01, t10, t11
    except:
        return None, None, None, None

def process_forecast(args):
    date_str, c, fh, stations_dict, isd_data = args
    grib_file = fetch_gfs_variables(date_str, c, fh)
    
    if not grib_file:
        return {'status': 'error', 'task': f"{date_str}_{c}_{fh}", 'records': []}
        
    records = []
    try:
        ds_sfc = xr.open_dataset(grib_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'surface', 'stepType': 'instant'})
        ds_2m = xr.open_dataset(grib_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'heightAboveGround', 'level': 2, 'stepType': 'instant'})
        
        issue_time = ds_sfc.time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
        valid_time = ds_sfc.valid_time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
        
        for stn, stn_info in stations_dict.items():
            obs_dict = isd_data.get(stn, {})
            obs = obs_dict.get(valid_time)
            if obs:
                lat_target = obs['lat']
                lon_target = obs['lon']
                
                # Check for lon translation
                if lon_target < 0:
                    lon_target += 360.0
                    
                val_sfc = ds_sfc.sel(latitude=lat_target, longitude=lon_target, method='nearest')
                val_2m = ds_2m.sel(latitude=lat_target, longitude=lon_target, method='nearest')
                
                temp_c = val_2m['t2m'].item() - 273.15
                z_reference = val_sfc['orog'].item()
                
                grid_lat = float(val_sfc.latitude.item())
                grid_lon = float(val_sfc.longitude.item())
                
                t00, t01, t10, t11 = extract_nodes(ds_2m['t2m'], lat_target, lon_target)
                
                records.append({
                    'station_id': stn,
                    'station_name': stn_info['name'],
                    'station_type': 'Synoptic/Airport',
                    'station_lat': lat_target,
                    'station_lon': lon_target,
                    'observation_time': valid_time,
                    'forecast_issue_time': issue_time,
                    'forecast_valid_time': valid_time,
                    'lead_time_hours': fh,
                    'observed_temperature_c': obs['temp_c'],
                    'gfs_temperature_c': round(temp_c, 2),
                    'station_elevation_m': obs['elev'],
                    'gfs_reference_elevation_m': round(z_reference, 2),
                    'elevation_difference_m': round(obs['elev'] - z_reference, 2),
                    'gfs_nearest_lat': grid_lat,
                    'gfs_nearest_lon': grid_lon,
                    'gfs_node00_temperature_c': round(t00, 2) if t00 else None,
                    'gfs_node01_temperature_c': round(t01, 2) if t01 else None,
                    'gfs_node10_temperature_c': round(t10, 2) if t10 else None,
                    'gfs_node11_temperature_c': round(t11, 2) if t11 else None,
                    'observation_qc': obs['qc'],
                    'forecast_cycle': f"{c}z",
                    'forecast_hour': fh,
                    'forecast_source': 'NOAA NCEI GFS Archive',
                    'forecast_file': grib_file
                })
        ds_sfc.close()
        ds_2m.close()
        return {'status': 'success', 'task': f"{date_str}_{c}_{fh}", 'records': records}
    except Exception as e:
        return {'status': 'error', 'task': f"{date_str}_{c}_{fh}", 'records': []}

def main():
    os.makedirs('experiments/phase6/data/raw', exist_ok=True)
    os.makedirs('experiments/phase6/data/validated', exist_ok=True)
    os.makedirs('experiments/phase6/data/processed', exist_ok=True)
    
    print("Loading selected stations...")
    df_stn = pd.read_csv('experiments/phase6/data_audit/mh_selected_stations.csv')
    stations_dict = {}
    for _, row in df_stn.iterrows():
        stations_dict[str(row['STATION_ID'])] = {'name': row['STATION NAME']}
        
    print(f"Fetching ISD data for {len(stations_dict)} stations...")
    isd_data = {}
    for stn in stations_dict:
        isd_data[stn] = fetch_isd_data(stn, 2023)
        print(f"Fetched {len(isd_data[stn])} records for {stn}")

    # Due to compute/storage limits of GFS archives, we scale to 2 representative continuous seasonal blocks:
    # block 1: Feb 1-10 (Winter/Spring transition)
    # block 2: Aug 1-10 (Monsoon peak)
    dates = []
    base_feb = datetime(2023, 2, 1)
    base_aug = datetime(2023, 8, 1)
    for i in range(10):
        dates.append(base_feb + timedelta(days=i))
        dates.append(base_aug + timedelta(days=i))
        
    cycles = ['00', '12']
    fhours = [12, 24, 36, 48]
    
    tasks = []
    for d in dates:
        date_str = d.strftime('%Y%m%d')
        for c in cycles:
            for fh in fhours:
                tasks.append((date_str, c, fh, stations_dict, isd_data))
                
    print(f"Dispatching {len(tasks)} GFS extraction tasks...")
    paired_records = []
    manifest = {'tasks': [], 'errors': [], 'successes': 0}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(process_forecast, tasks)
        for res in results:
            if res['status'] == 'success':
                paired_records.extend(res['records'])
                manifest['successes'] += 1
            else:
                manifest['errors'].append(res['task'])
            manifest['tasks'].append(res['task'])

    if paired_records:
        keys = paired_records[0].keys()
        out_csv = 'experiments/phase6/data/validated/phase6_expanded_dataset.csv'
        with open(out_csv, 'w', newline='') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(paired_records)
        print(f"\nSUCCESS: Generated {len(paired_records)} real pairs.")
    else:
        print("No paired records generated.")
        
    with open('experiments/phase6/data_audit/processing_manifest.json', 'w') as f:
        json.dump(manifest, f, indent=4)

if __name__ == '__main__':
    main()
