"""
preflight_national_gis.py — Preflight script for National GIS Rollout.
Tests connectivity, pagination, metadata, and identifier relationships across 16 sample states.
"""

import asyncio
import time
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(PROJECT_ROOT))

from app.gis.bharatmaps import BharatMapsClient
from app.gis.grammanchitra import GramManchitraClient

STATES_TO_TEST = {
    # 8 Main States
    27: "Maharashtra",
    24: "Gujarat",
    8: "Rajasthan",
    9: "Uttar Pradesh",
    19: "West Bengal",
    33: "Tamil Nadu",
    32: "Kerala",
    29: "Karnataka",
    # 8 Known Gap States
    12: "Arunachal Pradesh",
    13: "Nagaland",
    14: "Manipur",
    15: "Mizoram",
    17: "Meghalaya",
    11: "Sikkim",
    2: "Himachal Pradesh",
    1: "Jammu & Kashmir"
}

REPORT_FILE = PROJECT_ROOT / "experiments" / "official_data" / "national_gis_preflight.md"

async def run_preflight():
    bm_client = BharatMapsClient()
    gm_client = GramManchitraClient()
    
    report_lines = [
        "# National GIS Rollout Preflight Report\n",
        "This report tests a sample page from the polygon and point layers for 16 representative states.\n"
    ]
    
    try:
        for state_code, state_name in STATES_TO_TEST.items():
            report_lines.append(f"## {state_name} (LGD: {state_code})")
            print(f"Preflighting {state_name} (LGD: {state_code})...")
            
            # 1. Fetch Polygons
            start_time = time.time()
            polygons = []
            try:
                # Get just the first page by breaking early
                async for feature in bm_client.get_panchayat_polygons(state_code):
                    polygons.append(feature)
                    if len(polygons) >= 1000:  # standard page
                        break
                poly_time = time.time() - start_time
                poly_error = None
            except Exception as e:
                poly_time = time.time() - start_time
                poly_error = str(e)

            # 2. Fetch Points
            start_time = time.time()
            points = []
            try:
                async for feature in gm_client.get_panchayat_points(state_code):
                    points.append(feature)
                    if len(points) >= 1000:
                        break
                point_time = time.time() - start_time
                point_error = None
            except Exception as e:
                point_time = time.time() - start_time
                point_error = str(e)

            # Analyze Polygons
            poly_fields = list(polygons[0]["properties"].keys()) if polygons else []
            valid_state = all(str(p["properties"].get("ST_LGD")) == str(state_code) for p in polygons) if polygons else False
            
            # Analyze Points
            point_fields = list(points[0]["properties"].keys()) if points else []
            point_valid_state = all(str(p["properties"].get("ST_LGD")) == str(state_code) for p in points) if points else False
            
            # Identifier matching
            poly_ids = set(str(p["properties"].get("GPCODE")) for p in polygons if p["properties"].get("GPCODE"))
            point_ids = set(str(p["properties"].get("gp_code")) for p in points if p["properties"].get("gp_code"))
            
            exact_matches = len(poly_ids.intersection(point_ids))
            missing_point = len(poly_ids - point_ids)
            missing_poly = len(point_ids - poly_ids)

            # Status classification
            if len(polygons) > 0 and len(points) > 0:
                gis_status = "GIS_AVAILABLE"
            elif len(polygons) > 0 or len(points) > 0:
                gis_status = "GIS_PARTIAL"
            else:
                gis_status = "GIS_UNAVAILABLE"

            report_lines.append(f"- **Classification**: {gis_status}")
            report_lines.append(f"- **Polygons Sample**: {len(polygons)} features in {poly_time:.2f}s")
            if poly_error:
                report_lines.append(f"  - *Error*: {poly_error}")
            else:
                report_lines.append(f"  - *State Filter Valid*: {valid_state}")
                report_lines.append(f"  - *Fields*: {', '.join(poly_fields)}")

            report_lines.append(f"- **Points Sample**: {len(points)} features in {point_time:.2f}s")
            if point_error:
                report_lines.append(f"  - *Error*: {point_error}")
            else:
                report_lines.append(f"  - *State Filter Valid*: {point_valid_state}")
                report_lines.append(f"  - *Fields*: {', '.join(point_fields)}")
                
            report_lines.append("- **Identifier Match Sample**: ")
            report_lines.append(f"  - Exact ID Matches (GPCODE == gp_code): {exact_matches}")
            report_lines.append(f"  - Missing Point ID: {missing_point}")
            report_lines.append(f"  - Missing Polygon ID: {missing_poly}")
            report_lines.append("")
            
        # Write report
        REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
        REPORT_FILE.write_text("\n".join(report_lines))
        print(f"Preflight report written to {REPORT_FILE}")

    finally:
        await bm_client.close()
        await gm_client.close()

if __name__ == "__main__":
    asyncio.run(run_preflight())
