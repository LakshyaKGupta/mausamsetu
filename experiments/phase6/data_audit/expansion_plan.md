# Scientific Dataset Expansion Plan

## 1. Objective
To expand the Phase 6 baseline evaluation dataset to provide sufficient spatial, temporal, and geographic variance to scientifically justify advancing beyond simple baselines (i.e. to Baseline 4 redesign or Machine Learning).

## 2. Current vs. Desired Scope
- **Current Station Count**: 4 (Pune, Mumbai, Nagpur, Aurangabad)
- **Desired Additional Stations**: 20-30 verified, continuous NOAA ISD stations across Maharashtra (representing coastal, plateau, and Ghat regions).
- **Current Date Coverage**: 28 discontinuous days (Jan 1-7, Apr 1-7, Jul 1-7, Oct 1-7, 2023).
- **Desired Date Coverage**: 2-3 full contiguous years (e.g., 2021-2023) to capture continuous seasonal transitions, extreme events, and intra-seasonal variability.

## 3. Data Sources & Constraints
- **GFS Archive Availability**: The NOAA AWS S3 GFS archive provides continuous 0.25° resolution GRIB2 files historically. 
- **Observation-Source Limitations**: NOAA ISD provides excellent temporal continuity and standardized QA/QC but heavily biases towards airports and synoptic observatories. 
- **Rural/Synoptic Domain-Shift Limitation**: Because we rely on ISD (airport) data for calibration/validation, the models will learn physical relationships relevant to concrete/tarmac environments (urban heat islands, modified boundary layers). Applying these models directly to rural Gram Panchayats will induce a significant domain shift that must be carefully tracked.

## 4. Expected Computation & Storage Requirements
- **Storage**: ~2.5-3.0 GB of compressed GRIB2 subsets per contiguous year (extracting only surface/2m layers over a bounding box of Maharashtra).
- **Computation**: Expanding to ~3 years and 30 stations will require parsing ~20,000 GRIB2 files. Using `xarray/cfgrib` will necessitate a distributed or batch-processed extraction pipeline (e.g. multiprocessing across days/cycles) taking approximately 4-8 compute hours locally.

## 5. Prioritizing Data Quality
Quality supersedes row count. The expansion will strictly mandate:
1. Continuous operation: Stations with >10% missing daily reports will be excluded.
2. Verified coordinates: Station coordinates must precisely align with physical metadata.
3. Strict QA flags: Only ISD observations with verified QA flags (e.g., '1', '5') will be ingested.

## 6. Proposed Next Validation Design
Once the dataset is expanded, the validation protocol will adopt:
1. **Spatial Generalization**: A rigorous 5-fold Spatial Block Cross-Validation (training on N-k stations, testing on k entirely unseen stations).
2. **Temporal Generalization**: A rolling-origin or strict contiguous-year holdout (e.g. Train 2021-2022, Validate 2023) rather than discontinuous weekly blocks.
