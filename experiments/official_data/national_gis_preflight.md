# National GIS Rollout Preflight Report

This report tests a sample page from the polygon and point layers for 16 representative states.

## Maharashtra (LGD: 27)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 22.08s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.59s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 7
  - Missing Point ID: 986
  - Missing Polygon ID: 993

## Gujarat (LGD: 24)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 13.88s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.32s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 977
  - Missing Polygon ID: 1000

## Rajasthan (LGD: 8)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 12.96s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.29s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 144
  - Missing Point ID: 726
  - Missing Polygon ID: 856

## Uttar Pradesh (LGD: 9)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 13.71s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.36s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 905
  - Missing Polygon ID: 1000

## West Bengal (LGD: 19)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 15.18s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.36s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 361
  - Missing Point ID: 454
  - Missing Polygon ID: 639

## Tamil Nadu (LGD: 33)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 11.62s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.50s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 986
  - Missing Polygon ID: 1000

## Kerala (LGD: 32)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 15.45s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 941 features in 0.50s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 877
  - Missing Point ID: 0
  - Missing Polygon ID: 64

## Karnataka (LGD: 29)
- **Classification**: GIS_AVAILABLE
- **Polygons Sample**: 1000 features in 11.76s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 1000 features in 0.69s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 142
  - Missing Point ID: 597
  - Missing Polygon ID: 858

## Arunachal Pradesh (LGD: 12)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 0 features in 9.01s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 1000 features in 0.35s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 1000

## Nagaland (LGD: 13)
- **Classification**: GIS_UNAVAILABLE
- **Polygons Sample**: 0 features in 9.79s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 0 features in 0.63s
  - *State Filter Valid*: False
  - *Fields*: 
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 0

## Manipur (LGD: 14)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 0 features in 9.02s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 158 features in 0.42s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 158

## Mizoram (LGD: 15)
- **Classification**: GIS_UNAVAILABLE
- **Polygons Sample**: 0 features in 8.33s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 0 features in 0.39s
  - *State Filter Valid*: False
  - *Fields*: 
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 0

## Meghalaya (LGD: 17)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 1 features in 8.09s
  - *State Filter Valid*: True
  - *Fields*: GPCODE, GPNAME, ST_LGD, DT_LGD, blklgdcode
- **Points Sample**: 0 features in 0.57s
  - *State Filter Valid*: False
  - *Fields*: 
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 1
  - Missing Polygon ID: 0

## Sikkim (LGD: 11)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 0 features in 8.00s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 179 features in 0.72s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 179

## Himachal Pradesh (LGD: 2)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 0 features in 10.53s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 1000 features in 0.88s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 1000

## Jammu & Kashmir (LGD: 1)
- **Classification**: GIS_PARTIAL
- **Polygons Sample**: 0 features in 9.70s
  - *State Filter Valid*: False
  - *Fields*: 
- **Points Sample**: 1000 features in 0.39s
  - *State Filter Valid*: True
  - *Fields*: gp_code, gp_name, ST_LGD, DT_LGD, SDT_LGD, lat, lONG
- **Identifier Match Sample**: 
  - Exact ID Matches (GPCODE == gp_code): 0
  - Missing Point ID: 0
  - Missing Polygon ID: 1000
