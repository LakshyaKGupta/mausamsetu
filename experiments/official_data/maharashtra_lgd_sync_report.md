# Maharashtra LGD Sync Report

**Generated**: 2026-09-22 11:17:32 UTC
**Elapsed**: 0.5 seconds
**State**: Maharashtra (LGD Code: 27)

## Data Sources

| Layer | Source | Notes |
|-------|--------|-------|
| State | Embedded baseline | LGD Code 27, Ministry of Panchayati Raj |
| Districts | OSM Admin Centroids + LGD Codes | Coordinates are administrative centroids, NOT official panchayat points |
| Blocks/Sub-districts | Not provided | From official LGD CSV export |
| Panchayats | Not provided | From official LGD CSV export |
| Geography | LGD official (when provided in CSV) | Fallback: OPEN_METEO_GEOCODING_DERIVED |

> **NOTE**: District coordinates are derived from OpenStreetMap administrative boundaries,
> cross-referenced with official LGD codes. They are labelled `geometry_source = "OSM_ADMIN_CENTROID"`.
> They are suitable for district-level map display only.
>
> Panchayat coordinates from the LGD CSV are labelled `geometry_source = "LGD_OFFICIAL"`.
> Geocoding fallbacks are labelled `geometry_source = "OPEN_METEO_GEOCODING_DERIVED"`.

## Sync Statistics

### Districts
| Metric | Count |
|--------|-------|
| Records read | 36 |
| Inserted | 36 |
| Updated | 0 |
| Unchanged | 0 |

### Blocks (Sub-districts)
| Metric | Count |
|--------|-------|
| Records read | 0 |
| Inserted | 0 |
| Updated | 0 |

### Panchayats / Local Bodies
| Metric | Count |
|--------|-------|
| Records read | 0 |
| Inserted | 0 |
| Updated | 0 |
| Rejected | 0 |
| Duplicate LGD codes | 0 |
| Missing parent district/block | 0 |

## Current Database State

| Metric | Count |
|--------|-------|
| Districts | 36 |
| Blocks | 0 |
| Panchayats (total) | 0 |
| **Geography** | |
| Official coordinates | 0 |
| Derived (geocoding) | 0 |
| Review required | 0 |
| Geography unavailable | 0 |
| Has coordinates (any source) | 0 |
| **Weather** | |
| Weather available | 0 |
| Weather check pending | 0 |
| Weather unavailable | 0 |

## Errors (0)

No errors.


## Next Steps

1. **Provide LGD CSV**: Download from https://lgdirectory.gov.in (login required) and run:
   ```
   python -m backend.scripts.sync_lgd_maharashtra --lgd-csv /path/to/lgd_maharashtra.csv
   ```
2. **Geocode pending panchayats** (after CSV ingest):
   ```
   python -m backend.scripts.sync_lgd_maharashtra --geocode-pending
   ```
3. **Check weather availability** (after geocoding):
   ```
   python -m backend.scripts.sync_lgd_maharashtra --check-weather
   ```
