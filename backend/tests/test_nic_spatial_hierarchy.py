import pytest
from app.api.nic import _build_fallback_response

def test_layer_0_states():
    res = _build_fallback_response(0, "1=1", False, "json")
    assert "features" in res
    assert len(res["features"]) >= 28

    mh_geom = _build_fallback_response(0, "State_LGD=27", True, "geojson")
    assert mh_geom["type"] == "FeatureCollection"
    assert len(mh_geom["features"]) == 1
    assert mh_geom["features"][0]["properties"]["STNAME"] == "Maharashtra"
    assert mh_geom["features"][0]["geometry"]["type"] in ["Polygon", "MultiPolygon"]

def test_layer_1_districts():
    res = _build_fallback_response(1, "State_LGD=27", False, "json")
    assert "features" in res
    d_names = [f["attributes"]["D_Pan_Name"] for f in res["features"]]
    assert "Nagpur" in d_names
    assert "Pune" in d_names

    # Specific district geometry
    ngp_geom = _build_fallback_response(1, "Dist_LGD=2700", True, "geojson")
    assert ngp_geom["features"][0]["properties"]["D_Pan_Name"] == "Nagpur"
    assert ngp_geom["features"][0]["geometry"]["type"] in ["Polygon", "MultiPolygon"]

def test_layer_2_blocks():
    # Nagpur blocks
    ngp_blocks = _build_fallback_response(2, "dist_lgd=2700", False, "json")
    b_names = [f["attributes"]["B_Pan_Name"] for f in ngp_blocks["features"]]
    assert "Kalmeshwar" in b_names
    assert "Katol" in b_names

    # Kalmeshwar geometry
    kal_geom = _build_fallback_response(2, "block_lgd=270000", True, "geojson")
    assert kal_geom["features"][0]["properties"]["B_Pan_Name"] == "Kalmeshwar"
    assert kal_geom["features"][0]["geometry"]["type"] == "Polygon"

    # Pune blocks
    pune_blocks = _build_fallback_response(2, "dist_lgd=2702", False, "json")
    p_b_names = [f["attributes"]["B_Pan_Name"] for f in pune_blocks["features"]]
    assert "Baramati" in p_b_names
    assert "Junnar" in p_b_names

    # Baramati geometry near lat 18.15, lon 74.57
    bar_geom = _build_fallback_response(2, "block_lgd=270200", True, "geojson")
    assert bar_geom["features"][0]["properties"]["B_Pan_Name"] == "Baramati"
    coords = bar_geom["features"][0]["geometry"]["coordinates"][0][0]
    assert 73.0 <= coords[0] <= 76.0
    assert 17.0 <= coords[1] <= 19.5

def test_layer_3_gps():
    # Baramati GP near Baramati
    gp_geom = _build_fallback_response(3, "gp_code=27020000", True, "geojson")
    assert "Gram Panchayat" in gp_geom["features"][0]["properties"]["gp_name"]
    coords = gp_geom["features"][0]["geometry"]["coordinates"][0][0]
    assert 73.0 <= coords[0] <= 76.0
    assert 17.0 <= coords[1] <= 19.5


def test_multi_state_punjab_ludhiana():
    # Punjab districts
    res = _build_fallback_response(1, "State_LGD=3", False, "json")
    d_names = [f["attributes"]["D_Pan_Name"] for f in res["features"]]
    assert "Ludhiana" in d_names

    # Ludhiana blocks (using dist_lgd=300)
    ludh_blocks = _build_fallback_response(2, "dist_lgd=300", False, "json")
    b_names = [f["attributes"]["B_Pan_Name"] for f in ludh_blocks["features"]]
    assert "Jagraon" in b_names
    assert "Khanna" in b_names

    # Jagraon GPs
    jagraon_gps = _build_fallback_response(3, "blklgdcode='30000'", False, "json")
    assert len(jagraon_gps["features"]) == 8
    assert "Kalan Gram Panchayat" in [f["attributes"]["gp_name"] for f in jagraon_gps["features"]]


def test_all_36_indian_states_and_uts():
    from app.api.nic import ALL_INDIA_STATES_UTS
    assert len(ALL_INDIA_STATES_UTS) == 36

    for s in ALL_INDIA_STATES_UTS:
        lgd = s["State_LGD"]
        stname = s["STNAME"]

        # 1. State boundary polygon
        st_resp = _build_fallback_response(0, f"State_LGD={lgd}", True, "geojson")
        assert len(st_resp["features"]) >= 1, f"State {stname} (LGD {lgd}) returned 0 features"
        geom = st_resp["features"][0]["geometry"]
        assert geom["type"] in ["Polygon", "MultiPolygon"], f"Invalid geom type for {stname}"
        assert len(geom["coordinates"]) > 0

        # 2. Districts list
        d_resp = _build_fallback_response(1, f"State_LGD={lgd}", False, "json")
        assert len(d_resp["features"]) >= 1, f"State {stname} (LGD {lgd}) returned 0 districts"

        # 3. First district block hierarchy
        first_d = d_resp["features"][0]["attributes"]
        first_d_lgd = first_d["Dist_LGD"]
        b_resp = _build_fallback_response(2, f"dist_lgd={first_d_lgd}", False, "json")
        assert len(b_resp["features"]) >= 1, f"District {first_d['D_Pan_Name']} in {stname} returned 0 blocks"


