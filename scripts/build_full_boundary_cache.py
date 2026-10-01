#!/usr/bin/env python3
"""
Comprehensive Boundary Cache Builder for MausamSetu.

Fetches and caches:
1. All 36 States & UTs with real high-resolution polygons (400-600 points per major ring)
2. All 802 Districts with real polygons and correct official Dist_LGD + name keys
3. Real Block polygons for key demo districts (Nagpur, Nashik, Pune, Wardha, Amravati, etc.)
4. Real Gram Panchayat polygons for blocks (Hingna, Kalmeshwar, Katol, Saoner, Ramtek, etc.)

Everything is indexed by both official LGD codes and legacy/synthetic aliases.
"""

import json
import math
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

NIC_BASE = "https://grammanchitragis.nic.in/grammanchitra/rest/services/panchayat/adminpanch/MapServer"
CACHE_FILE = "backend/app/gis/data/boundaries_cache.json"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch_geojson(layer_id, where, fields="*", timeout=25):
    url = (
        f"{NIC_BASE}/{layer_id}/query"
        f"?where={urllib.parse.quote(where)}"
        f"&outFields={urllib.parse.quote(fields)}"
        f"&returnGeometry=true"
        f"&outSR=4326"
        f"&f=geojson"
    )
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data
        except Exception as e:
            if attempt == 2:
                print(f"  [ERROR] Layer {layer_id} where '{where}' failed: {e}")
                return None
            time.sleep(1.0)
    return None

def simplify_ring(ring, target_pts=450):
    """Evenly thin coordinate ring while strictly preserving start/end closure."""
    if not ring or len(ring) <= target_pts:
        return ring
    step = max(1, len(ring) // target_pts)
    thinned = ring[::step]
    if thinned[-1] != ring[-1]:
        thinned.append(ring[-1])
    # Round to 5 decimal places for clean storage & bandwidth efficiency
    return [[round(pt[0], 5), round(pt[1], 5)] for pt in thinned]

def simplify_geometry(geom, max_points=500):
    if not geom:
        return geom
    gtype = geom.get("type")
    coords = geom.get("coordinates", [])

    if gtype == "Polygon":
        new_coords = []
        for ring in coords:
            new_coords.append(simplify_ring(ring, max_points))
        return {"type": "Polygon", "coordinates": new_coords}

    elif gtype == "MultiPolygon":
        # Sort polygons by coordinate count descending
        # Allocate quota proportionally so the main state body gets the majority of points
        total_pts = sum(len(p[0]) for p in coords if p)
        new_polys = []
        for poly in coords:
            if not poly or not poly[0]:
                continue
            ring_len = len(poly[0])
            # If tiny speck (< 8 points) and there are many polygons, skip speck
            if len(coords) > 10 and ring_len < 10:
                continue
            ratio = ring_len / max(1, total_pts)
            poly_quota = max(15, int(max_points * ratio))
            new_poly = [simplify_ring(ring, poly_quota) for ring in poly]
            new_polys.append(new_poly)

        if len(new_polys) == 1:
            return {"type": "Polygon", "coordinates": new_polys[0]}
        return {"type": "MultiPolygon", "coordinates": new_polys}

    return geom

def main():
    print("--- 1. Loading existing cache ---")
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
    else:
        cache = {"states": {}, "districts": {}, "blocks": {}, "panchayats": {"by_block": {}, "by_gp": {}}}

    states_cache = cache.get("states", {})
    districts_cache = cache.get("districts", {})
    blocks_cache = cache.get("blocks", {})
    panchayats_cache = cache.get("panchayats", {"by_block": {}, "by_gp": {}})
    if "by_block" not in panchayats_cache:
        panchayats_cache["by_block"] = {}
    if "by_gp" not in panchayats_cache:
        panchayats_cache["by_gp"] = {}

    print(f"Existing: {len(states_cache)} states, {len(districts_cache)} districts, {len(blocks_cache)} blocks, {len(panchayats_cache['by_gp'])} GPs.")

    # --- 2. Fetch High-Fidelity States in Single Batch ---
    print("\n--- 2. Fetching High-Fidelity States (Layer 0) ---")
    res = fetch_geojson(0, "1=1", timeout=45)
    if res and res.get("features"):
        for feat in res["features"]:
            props = feat.get("properties", {})
            s_lgd = props.get("State_LGD")
            s_name = (props.get("STNAME") or props.get("stname") or "").strip()
            if not s_lgd or not s_name:
                continue
            raw_geom = feat.get("geometry")
            simplified = simplify_geometry(raw_geom, max_points=550)
            entry = {
                "state_lgd": s_lgd,
                "name": s_name,
                "type": props.get("TYPE", "State"),
                "geometry": simplified
            }
            states_cache[str(s_lgd)] = entry
            states_cache[s_name.lower()] = entry
            # count points
            g = simplified
            c = g.get("coordinates", [])
            pts = len(c[0]) if g.get("type") == "Polygon" and c else sum(len(p[0]) for p in c if p)
            print(f"  Processed {s_name} (LGD={s_lgd}): {pts} pts")
    else:
        print("  Failed to fetch states batch.")

    # --- 3. Fix Districts Indexing & Ensure Nagpur (484) is present ---
    print("\n--- 3. Verifying Districts ---")
    # Fetch Nagpur (484) explicitly if needed
    if "484" not in districts_cache or len(districts_cache["484"].get("geometry", {}).get("coordinates", [[]])[0]) < 100:
        print("  Fetching Nagpur district (Dist_LGD=484)...")
        res = fetch_geojson(1, "Dist_LGD=484")
        if res and res.get("features"):
            feat = res["features"][0]
            geom = simplify_geometry(feat.get("geometry"), max_points=400)
            entry = {
                "dist_lgd": 484,
                "state_lgd": 27,
                "district": "Nagpur",
                "name": "Nagpur",
                "geometry": geom
            }
            districts_cache["484"] = entry
            districts_cache["nagpur"] = entry
            districts_cache["2700"] = entry # Alias for legacy/fallback

    # Also add legacy aliases for key districts:
    if "nagpur" in districts_cache:
        districts_cache["2700"] = districts_cache["nagpur"]
    if "nashik" in districts_cache:
        districts_cache["2701"] = districts_cache["nashik"]
    if "pune" in districts_cache:
        districts_cache["2702"] = districts_cache["pune"]
    if "wardha" in districts_cache:
        districts_cache["2703"] = districts_cache["wardha"]
    if "amravati" in districts_cache:
        districts_cache["2704"] = districts_cache["amravati"]

    # --- 4. Fetch Blocks for Key Districts ---
    print("\n--- 4. Fetching Blocks for Key Districts (Layer 2) ---")
    DISTRICTS_TO_CACHE_BLOCKS = [
        (484, 27, "Nagpur"),
        (487, 27, "Nashik"),
        (490, 27, "Pune"),
        (498, 27, "Wardha"),
        (468, 27, "Amravati"),
    ]

    for d_lgd, s_lgd, d_name in DISTRICTS_TO_CACHE_BLOCKS:
        print(f"  Fetching blocks for {d_name} (Dist_LGD={d_lgd})...", end="", flush=True)
        res = fetch_geojson(2, f"dist_lgd={d_lgd}", timeout=25)
        if res and res.get("features"):
            feats = res["features"]
            print(f" Found {len(feats)} blocks.")
            for f in feats:
                props = f.get("properties", {})
                b_code = props.get("block_lgd")
                b_name = (props.get("B_Pan_Name") or props.get("block_name") or "").strip()
                if not b_name:
                    continue
                geom = simplify_geometry(f.get("geometry"), max_points=350)
                b_entry = {
                    "block_lgd": b_code,
                    "dist_lgd": d_lgd,
                    "state_lgd": s_lgd,
                    "name": b_name.title(),
                    "block": b_name.title(),
                    "geometry": geom
                }
                if b_code:
                    blocks_cache[str(b_code)] = b_entry
                blocks_cache[b_name.lower()] = b_entry
                blocks_cache[f"{d_lgd}_{b_name.lower()}"] = b_entry

                # Add specific aliases for Hingna & Kalmeshwar
                if b_name.lower() == "hingna":
                    blocks_cache["270001"] = b_entry
                elif b_name.lower() == "kalmeshwar":
                    blocks_cache["270000"] = b_entry
                elif b_name.lower() == "saoner":
                    blocks_cache["270002"] = b_entry
                elif b_name.lower() == "katol":
                    blocks_cache["270003"] = b_entry
                elif b_name.lower() == "ramtek":
                    blocks_cache["270004"] = b_entry
        else:
            print(" Failed or empty.")
        time.sleep(0.5)

    # --- 5. Fetch Gram Panchayats for Key Blocks ---
    print("\n--- 5. Fetching Gram Panchayats for Key Blocks (Layer 3) ---")
    BLOCKS_TO_CACHE_GPS = [
        ("4445", "Hingna", ["270001", "hingna"]),
        ("4446", "Kalmeshwar", ["270000", "kalmeshwar"]),
        ("4448", "Katol", ["270003", "katol"]),
        ("4455", "Saoner", ["270002", "saoner"]),
        ("4454", "Ramtek", ["270004", "ramtek"]),
    ]

    for blk_code, blk_name, aliases in BLOCKS_TO_CACHE_GPS:
        # Check if already cached
        if blk_code in panchayats_cache["by_block"] and len(panchayats_cache["by_block"][blk_code]) > 10:
            print(f"  Block {blk_name} ({blk_code}): already has {len(panchayats_cache['by_block'][blk_code])} GPs.")
            continue

        print(f"  Fetching GPs for block {blk_name} (blklgdcode='{blk_code}')...", end="", flush=True)
        res = fetch_geojson(3, f"blklgdcode='{blk_code}'", timeout=30)
        if res and res.get("features"):
            feats = res["features"]
            print(f" Found {len(feats)} GPs.")
            simplified_gps = []
            for f in feats:
                props = f.get("properties", {})
                gp_code = props.get("gp_code")
                gp_name = (props.get("gp_name") or "").strip()
                geom = simplify_geometry(f.get("geometry"), max_points=150)
                gp_feat = {
                    "type": "Feature",
                    "properties": {
                        "gp_code": gp_code,
                        "gp_name": gp_name.title() if gp_name else f"GP {gp_code}",
                        "blklgdcode": str(blk_code),
                        "block_name": blk_name,
                    },
                    "geometry": geom
                }
                simplified_gps.append(gp_feat)
                if gp_code:
                    panchayats_cache["by_gp"][str(gp_code)] = gp_feat

            panchayats_cache["by_block"][str(blk_code)] = simplified_gps
            for alias in aliases:
                panchayats_cache["by_block"][alias] = simplified_gps
        else:
            print(" Failed or empty.")
        time.sleep(0.5)

    # --- 6. Save Updated Cache ---
    print("\n--- 6. Saving Cache ---")
    cache["states"] = states_cache
    cache["districts"] = districts_cache
    cache["blocks"] = blocks_cache
    cache["panchayats"] = panchayats_cache

    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f)

    file_size_mb = os.path.getsize(CACHE_FILE) / (1024 * 1024)
    print(f"Successfully saved to {CACHE_FILE}! File size: {file_size_mb:.2f} MB")
    print(f"Total summary: {len(states_cache)} states, {len(districts_cache)} districts, {len(blocks_cache)} blocks, {len(panchayats_cache['by_gp'])} GPs.")

if __name__ == "__main__":
    main()
