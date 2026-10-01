#!/usr/bin/env python3
"""
Fetch real administrative boundaries from NIC GIS server and 
cache them into boundaries_cache.json for reliable offline use.

Usage: python3 scripts/fetch_boundaries.py
"""
import json
import time
import sys
import urllib.request
import ssl

CACHE_FILE = "backend/app/gis/data/boundaries_cache.json"
NIC_BASE = "https://grammanchitragis.nic.in/grammanchitra/rest/services/panchayat/adminpanch/MapServer"

# All state LGD codes
STATE_LGDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,27,28,29,30,32,33,34,35,36,37,38]

STATE_NAMES = {
    1: "jammu and kashmir", 2: "himachal pradesh", 3: "punjab", 4: "chandigarh",
    5: "uttarakhand", 6: "haryana", 7: "delhi", 8: "rajasthan", 9: "uttar pradesh",
    10: "bihar", 11: "sikkim", 12: "arunachal pradesh", 13: "nagaland", 14: "manipur",
    15: "mizoram", 16: "tripura", 17: "meghalaya", 18: "assam", 19: "west bengal",
    20: "jharkhand", 21: "odisha", 22: "chhattisgarh", 23: "madhya pradesh",
    24: "gujarat", 27: "maharashtra", 28: "andhra pradesh", 29: "karnataka",
    30: "goa", 32: "kerala", 33: "tamil nadu", 34: "puducherry", 35: "andaman and nicobar",
    36: "telangana", 37: "ladakh", 38: "dadra and nagar haveli and daman and diu"
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def nic_fetch(layer, where, fields="*"):
    url = (
        f"{NIC_BASE}/{layer}/query"
        f"?where={urllib.parse.quote(where)}"
        f"&outFields={fields}"
        f"&returnGeometry=true"
        f"&outSR=4326"
        f"&f=geojson"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  WARN: fetch failed ({e})")
        return None

import urllib.parse

def simplify_geometry(geom, max_points=800):
    """Reduce coordinate count while keeping shape recognizable."""
    if not geom:
        return geom
    t = geom.get("type")
    def thin(ring, max_pts):
        if len(ring) <= max_pts:
            return ring
        step = max(1, len(ring) // max_pts)
        thinned = ring[::step]
        if thinned[-1] != ring[-1]:
            thinned.append(ring[-1])
        return thinned
    
    if t == "Polygon":
        return {"type": "Polygon", "coordinates": [thin(ring, max_points) for ring in geom["coordinates"]]}
    elif t == "MultiPolygon":
        num_polys = max(1, len(geom["coordinates"]))
        pts_per_poly = max(10, max_points // num_polys)
        simplified = []
        for poly in geom["coordinates"]:
            simplified.append([thin(ring, max(10, pts_per_poly // max(1, len(poly)))) for ring in poly])
        return {"type": "MultiPolygon", "coordinates": simplified}
    return geom

def main():
    print("Loading existing cache...")
    try:
        with open(CACHE_FILE) as f:
            cache = json.load(f)
    except:
        cache = {"states": {}, "districts": {}}
    
    states_cache = cache.get("states", {})
    districts_cache = cache.get("districts", {})

    print(f"\n=== Fetching State Boundaries ({len(STATE_LGDS)} states) ===")
    for lgd in STATE_LGDS:
        name = STATE_NAMES.get(lgd, f"state_{lgd}")
        
        # Skip if already cached with real geometry
        existing = states_cache.get(str(lgd)) or states_cache.get(name)
        if existing and existing.get("geometry"):
            g = existing["geometry"]
            coords = g.get("coordinates", [])
            t = g.get("type", "")
            pts = len(coords[0]) if t == "Polygon" and coords else (len(coords[0][0]) if t == "MultiPolygon" and coords and coords[0] else 0)
            if pts > 20:
                print(f"  [{lgd}] {name}... SKIP (already cached, {pts} pts)")
                continue
        
        print(f"  [{lgd}] {name}...", end=" ", flush=True)
        
        data = nic_fetch(0, f"State_LGD={lgd}")
        if data and data.get("features"):
            feat = data["features"][0]
            geom = feat.get("geometry")
            props = feat.get("properties", {})
            if geom:
                simplified = simplify_geometry(geom, max_points=600)
                entry = {
                    "name": props.get("STNAME", name.title()),
                    "state_lgd": lgd,
                    "geometry": simplified
                }
                states_cache[str(lgd)] = entry
                states_cache[name] = entry
                t = geom.get("type")
                coords = geom.get("coordinates", [])
                if t == "Polygon":
                    n = len(coords[0]) if coords else 0
                elif t == "MultiPolygon":
                    n = sum(len(ring[0]) for ring in coords if ring) if coords else 0
                else:
                    n = 0
                print(f"OK ({t}, {n} pts → simplified)")
            else:
                print("NO GEOMETRY")
        else:
            print("FAILED")
        time.sleep(0.3)
    
    print(f"\n=== Fetching District Boundaries for major states ===")
    # Fetch all districts for all states
    for lgd in STATE_LGDS:
        name = STATE_NAMES.get(lgd, f"state_{lgd}")
        print(f"  State {lgd} ({name}) districts...", end=" ", flush=True)
        
        data = nic_fetch(1, f"State_LGD={lgd}", fields="Dist_LGD,D_Pan_Name,State_LGD")
        if data and data.get("features"):
            feats = data["features"]
            count = 0
            for feat in feats:
                props = feat.get("properties", {})
                geom = feat.get("geometry")
                dist_lgd = props.get("Dist_LGD")
                dist_name = (props.get("D_Pan_Name") or "").lower().strip()
                if dist_lgd and dist_name and geom:
                    simplified = simplify_geometry(geom, max_points=300)
                    entry = {
                        "district": dist_name.title(),
                        "dist_lgd": dist_lgd,
                        "state_lgd": lgd,
                        "state": name.title(),
                        "geometry": simplified
                    }
                    districts_cache[dist_name] = entry
                    districts_cache[str(dist_lgd)] = entry
                    count += 1
            print(f"OK ({count} districts)")
        else:
            print("FAILED")
        time.sleep(0.4)
    
    print(f"\n=== Saving cache ===")
    cache["states"] = states_cache
    cache["districts"] = districts_cache
    
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, separators=(",", ":"))
    
    size = len(json.dumps(cache))
    print(f"Saved {CACHE_FILE} ({size/1024:.0f} KB)")
    print(f"States: {len(set(v['name'] for v in states_cache.values() if isinstance(v, dict) and 'name' in v))}")
    print(f"Districts: {len(set(v['district'] for v in districts_cache.values() if isinstance(v, dict) and 'district' in v))}")

if __name__ == "__main__":
    main()
