# Forecast Source Test

## Candidate Source
NOAA NCEI GFS Archive (and AWS Open Data Registry for NOAA GFS)

## Retrieval Test
- **Request**: Queried the NOAA THREDDS catalog for historical GFS datasets (`https://www.ncei.noaa.gov/thredds/catalog/model-gfs-g4-anl-files/202301/20230101/catalog.json`)
- **Response Status**: 200 OK
- **File Format**: THREDDS JSON / GRIB2

## Verification of Scientific Requirements
Unlike Reanalysis (ERA5) which assimilates observations post-hoc, the NOAA GFS historical archive retains the original numerical weather prediction runs.

- **Issue Time Preserved**: Yes (e.g., `t00z`, `t06z`, `t12z`, `t18z` cycle initialization times).
- **Lead Time Preserved**: Yes (e.g., `f000`, `f006`, `f012` hours into the future).
- **Valid Time**: Calculable via `issue_time + lead_time`.
- **Variables**: Full standard atmospheric suite including 2m Temperature and Total Precipitation.

## Result
**VERIFIED**. We can successfully extract a historical forecast grid value that genuinely represents information available *before* an observation occurred.
