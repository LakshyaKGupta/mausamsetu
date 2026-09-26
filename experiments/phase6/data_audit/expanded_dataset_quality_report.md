# Expanded Dataset Quality Report

## 1. Overview
- **Total Candidate Stations**: 75
- **Usable Stations in Dataset**: 18
- **Date Range**: 2023-02-01T12:00:00 to 2023-08-12T12:00:00
- **Total Valid Pairs**: 1660

## 2. Completeness by Station
| Station ID | Name | Pairs |
|---|---|---|
| 43063099999 | PUNE | 160 |
| 43014099999 | AURANGABAD | 160 |
| 42933099999 | AKOLA | 156 |
| 43110099999 | RATNAGIRI | 150 |
| 43117099999 | SOLAPUR | 120 |
| 43111099999 | MAHABALESHWAR | 80 |
| 43113099999 | SATARA | 79 |
| 42851099999 | JALGAON | 77 |
| 43158099999 | SANGLI | 76 |
| 43157099999 | KOLHAPUR | 76 |
| 42871099999 | GONDIA ARPT/BIRSI | 73 |
| 42943099999 | YEOTMAL | 73 |
| 42939099999 | WARDHA | 73 |
| 43017099999 | PARBHANI | 73 |
| 43021099999 | NANDED | 71 |
| 43029099999 | CHANDRAPUR | 69 |
| 43069099999 | BARAMATI | 58 |
| 42920099999 | OZAR AIR FORCE STATION /NASHIK ARPT | 36 |

## 3. Lead Time Distribution
- **12h**: 419 pairs
- **24h**: 413 pairs
- **36h**: 414 pairs
- **48h**: 414 pairs

## 4. Quality Control
- **Missingness**: 0 (Dataset only includes successfully matched non-null pairs)
- **QC Rejection Rate**: Unmatched or rejected ISD records ('9999' or QC!='1,5') were excluded at generation.
- **Timestamp Rejection Rate**: Handled strictly via GFS valid_time exact matching to ISD hourly reporting.
