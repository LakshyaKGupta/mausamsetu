import os
import requests
import xarray as xr
import csv

# 1. Download GFS GRIB2 File
gfs_url = "https://noaa-gfs-bdp-pds.s3.amazonaws.com/gfs.20230101/00/atmos/gfs.t00z.pgrb2.0p25.f024"
gfs_file = "experiments/phase6/data/raw/gfs.t00z.pgrb2.0p25.f024"

if not os.path.exists(gfs_file):
    print("Downloading GFS file...")
    r = requests.get(gfs_url, stream=True)
    with open(gfs_file, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print("Download complete.")

# 2. Parse GFS File
print("Parsing GRIB2...")
# GRIB2 often has multiple hypercubes; filter by typeOfLevel='surface' for orography and 'heightAboveGround' for temp
ds_sfc = xr.open_dataset(gfs_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'surface', 'stepType': 'instant'})
ds_2m = xr.open_dataset(gfs_file, engine='cfgrib', filter_by_keys={'typeOfLevel': 'heightAboveGround', 'level': 2, 'stepType': 'instant'})

# 3. Extract metadata
issue_time = ds_sfc.time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
valid_time = ds_sfc.valid_time.dt.strftime('%Y-%m-%dT%H:%M:%S').item()
lead_time_step = ds_sfc.step.item()
lead_time_hours = lead_time_step / 3600000000000  # timedelta64[ns] to hours

print(f"Cycle Issue Time: {issue_time}")
print(f"Forecast Valid Time: {valid_time}")
print(f"Lead Time (h): {lead_time_hours}")

# 4. Extract data for Pune (Lat 18.53, Lon 73.85)
# GFS 0.25 deg grid typically uses 0-360 longitudes
lat_target = 18.53
lon_target = 73.85

# Nearest neighbor
val_sfc = ds_sfc.sel(latitude=lat_target, longitude=lon_target, method='nearest')
val_2m = ds_2m.sel(latitude=lat_target, longitude=lon_target, method='nearest')

temp_k = val_2m['t2m'].item()
temp_c = temp_k - 273.15
# Orography / surface geopotential height
# `orog` is surface elevation in meters
z_reference = val_sfc['orog'].item()

grid_lat = float(val_sfc.latitude.item())
grid_lon = float(val_sfc.longitude.item())

# 5. Fetch Pune ISD data
isd_url = "https://www.ncei.noaa.gov/data/global-hourly/access/2023/43063099999.csv"
r_isd = requests.get(isd_url, stream=True)
isd_lines = r_isd.text.split('\n')

observation = None
for line in isd_lines[1:]:
    if not line.strip(): continue
    parts = list(csv.reader([line]))[0]
    date_str = parts[1] # "2023-01-01T00:00:00"
    
    # We want to match the GFS valid time exactly
    if date_str == valid_time:
        tmp_part = parts[13]
        tmp_val = tmp_part.split(',')[0]
        tmp_qc = tmp_part.split(',')[1] if ',' in tmp_part else '9'
        if tmp_val != '9999' and tmp_qc in ['1', '5']:
            temp_obs_c = int(tmp_val) / 10.0
            observation = {
                'time': date_str,
                'temp_c': temp_obs_c,
                'qc': tmp_qc
            }
            break

# 6. Pair & Write
if observation:
    paired_records = [{
        'station_id': '43063099999',
        'station_lat': 18.53,
        'station_lon': 73.85,
        'station_type': 'Synoptic/Airport',
        'observation_time': observation['time'],
        'forecast_issue_time': issue_time,
        'forecast_valid_time': valid_time,
        'lead_time_hours': int(lead_time_hours),
        'observed_temperature_c': observation['temp_c'],
        'gfs_temperature_c': round(temp_c, 2),
        'station_elevation_m': 558.0,
        'gfs_reference_elevation_m': round(z_reference, 2),
        'elevation_difference_m': round(558.0 - z_reference, 2),
        'observation_qc': observation['qc'],
        'forecast_cycle': '00z',
        'forecast_hour': 24,
        'gfs_grid_lat': grid_lat,
        'gfs_grid_lon': grid_lon,
        'forecast_source': 'NOAA NCEI GFS Archive',
        'forecast_file': gfs_file
    }]
    
    with open('experiments/phase6/data/validated/phase6_real_gfs_isd_temperature.csv', 'w', newline='') as f:
        dict_writer = csv.DictWriter(f, fieldnames=paired_records[0].keys())
        dict_writer.writeheader()
        dict_writer.writerows(paired_records)
    print("SUCCESS: Wrote 1 real paired record.")
else:
    print("FAILED: Could not find matching observation.")

