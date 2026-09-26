import os
import requests
import xarray as xr
import csv
from datetime import datetime, timedelta
import concurrent.futures

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
    r = requests.get(url, stream=True)
    if r.status_code != 200:
        return {}
        
    isd_lines = r.text.split('\n')
    obs = {}
    for line in isd_lines[1:]:
        if not line.strip(): continue
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
    return obs

def process_forecast(args):
    date_str, c, fh, stations, isd_data = args
    print(f"Processing {date_str} cycle {c} fhour {fh}")
    grib_file = fetch_gfs_variables(date_str, c, fh)
    if not grib_file:
        print(f"Failed to fetch GFS for {date_str} {c}z fh{fh}.")
        return []
        
    records = []
    try:
        ds_sfc = xr.open_dataset(grib_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'surface', 'stepType': 'instant'})
        ds_2m = xr.open_dataset(grib_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'heightAboveGround', 'level': 2, 'stepType': 'instant'})
        
        issue_time = ds_sfc.time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
        valid_time = ds_sfc.valid_time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
        
        for stn, stn_type in stations.items():
            obs_dict = isd_data.get(stn, {})
            obs = obs_dict.get(valid_time)
            if obs:
                lat_target = obs['lat']
                lon_target = obs['lon']
                val_sfc = ds_sfc.sel(latitude=lat_target, longitude=lon_target, method='nearest')
                val_2m = ds_2m.sel(latitude=lat_target, longitude=lon_target, method='nearest')
                
                temp_c = val_2m['t2m'].item() - 273.15
                z_reference = val_sfc['orog'].item()
                
                grid_lat = float(val_sfc.latitude.item())
                grid_lon = float(val_sfc.longitude.item())
                
                records.append({
                    'station_id': stn,
                    'station_lat': lat_target,
                    'station_lon': lon_target,
                    'station_type': stn_type,
                    'observation_time': valid_time,
                    'forecast_issue_time': issue_time,
                    'forecast_valid_time': valid_time,
                    'lead_time_hours': fh,
                    'observed_temperature_c': obs['temp_c'],
                    'gfs_temperature_c': round(temp_c, 2),
                    'station_elevation_m': obs['elev'],
                    'gfs_reference_elevation_m': round(z_reference, 2),
                    'elevation_difference_m': round(obs['elev'] - z_reference, 2),
                    'observation_qc': obs['qc'],
                    'forecast_cycle': f"{c}z",
                    'forecast_hour': fh,
                    'gfs_grid_lat': grid_lat,
                    'gfs_grid_lon': grid_lon,
                    'forecast_source': 'NOAA NCEI GFS Archive',
                    'forecast_file': grib_file
                })
        ds_sfc.close()
        ds_2m.close()
    except Exception as e:
        print(f"Error parsing {grib_file}: {e}")
    return records

def main():
    os.makedirs('experiments/phase6/data/raw', exist_ok=True)
    os.makedirs('experiments/phase6/data/validated', exist_ok=True)

    stations = {
        '43063099999': 'Synoptic/Airport', # Pune
        '43003099999': 'Synoptic/Airport', # Mumbai
        '42867099999': 'Synoptic/Airport', # Nagpur
        '43014099999': 'Synoptic/Airport'  # Aurangabad
    }

    print("Fetching ISD data for all stations...")
    isd_data = {}
    for stn in stations:
        isd_data[stn] = fetch_isd_data(stn, 2023)
        print(f"Fetched {len(isd_data[stn])} records for {stn}")

    # Jan 1-7, Apr 1-7, Jul 1-7, Oct 1-7
    base_dates = [
        datetime(2023, 1, 1),
        datetime(2023, 4, 1),
        datetime(2023, 7, 1),
        datetime(2023, 10, 1)
    ]
    
    dates = []
    for b in base_dates:
        for i in range(7):
            dates.append(b + timedelta(days=i))
            
    cycles = ['00', '12']
    fhours = [12, 24, 36, 48]
    
    tasks = []
    for d in dates:
        date_str = d.strftime('%Y%m%d')
        for c in cycles:
            for fh in fhours:
                tasks.append((date_str, c, fh, stations, isd_data))
                
    paired_records = []
    
    print(f"Dispatching {len(tasks)} GFS extraction tasks...")
    # Use max_workers=8 to not overwhelm the NCEI S3 bucket but speed it up.
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(process_forecast, tasks)
        for res in results:
            paired_records.extend(res)

    if paired_records:
        keys = paired_records[0].keys()
        out_csv = 'experiments/phase6/data/validated/phase6_real_gfs_isd_expanded.csv'
        with open(out_csv, 'w', newline='') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(paired_records)
        print(f"\nSUCCESS: Generated {len(paired_records)} real pairs.")
    else:
        print("No paired records generated.")

if __name__ == '__main__':
    main()
