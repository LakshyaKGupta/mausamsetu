"""India-First Geography & Multi-Crop API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.models.models import Panchayat
from app.schemas.schemas import (
    StateConfigOut,
    DistrictItemOut,
    BlockItemOut,
    PanchayatHierarchyOut,
    CropMetadataOut,
    CropGrowthStageOut,
)

router = APIRouter(prefix="/geography", tags=["geography"])

# ---------------------------------------------------------------------------
# India-First Configuration Master Data
# ---------------------------------------------------------------------------

STATES_DATA: list[dict] = [
    {
        "state": "Maharashtra",
        "code": "MH",
        "languages": ["mr", "hi", "en"],
        "major_crops": ["soybean", "cotton", "wheat", "orange", "chickpea"],
        "districts_count": 36,
        "districts": [
            {
                "district": "Nagpur",
                "lat": 21.1458, "lon": 79.0882, "elevation_m": 310.0,
                "blocks": [
                    {"block": "Kalmeshwar", "panchayats_count": 24, "assigned_officer": "Rajesh Sharma", "lat": 21.2333, "lon": 78.9167, "elevation_m": 328.0},
                    {"block": "Hingna", "panchayats_count": 20, "assigned_officer": "Sunita Patil", "lat": 21.0667, "lon": 78.9667, "elevation_m": 315.0},
                    {"block": "Saoner", "panchayats_count": 18, "assigned_officer": "Vikas Deshmukh", "lat": 21.4667, "lon": 78.9000, "elevation_m": 332.0},
                    {"block": "Katol", "panchayats_count": 16, "assigned_officer": "Anil Thakre", "lat": 21.2786, "lon": 78.5867, "elevation_m": 417.0},
                    {"block": "Ramtek", "panchayats_count": 19, "assigned_officer": "Pooja Raut", "lat": 21.3963, "lon": 79.3333, "elevation_m": 345.0},
                ]
            },
            {
                "district": "Nashik",
                "lat": 19.9973, "lon": 73.7910, "elevation_m": 584.0,
                "blocks": [
                    {"block": "Dindori", "panchayats_count": 25, "assigned_officer": "Nitin Bhamre", "lat": 20.2000, "lon": 73.8333, "elevation_m": 620.0},
                    {"block": "Niphad", "panchayats_count": 28, "assigned_officer": "Sachin Patil", "lat": 20.0833, "lon": 74.1167, "elevation_m": 560.0},
                ]
            },
            {
                "district": "Pune",
                "lat": 18.5204, "lon": 73.8567, "elevation_m": 560.0,
                "blocks": [
                    {"block": "Baramati", "panchayats_count": 30, "assigned_officer": "Amol Jagtap", "lat": 18.1517, "lon": 74.5771, "elevation_m": 538.0},
                    {"block": "Junnar", "panchayats_count": 24, "assigned_officer": "Sneha More", "lat": 19.2069, "lon": 73.8767, "elevation_m": 689.0},
                ]
            },
            {
                "district": "Wardha",
                "lat": 20.7453, "lon": 78.6022, "elevation_m": 234.0,
                "blocks": [
                    {"block": "Deoli", "panchayats_count": 22, "assigned_officer": "Pradeep Rane", "lat": 20.6558, "lon": 78.4831, "elevation_m": 240.0},
                    {"block": "Arvi", "panchayats_count": 19, "assigned_officer": "Kavita Shinde", "lat": 20.9833, "lon": 78.2333, "elevation_m": 260.0},
                ]
            },
            {
                "district": "Amravati",
                "lat": 20.9320, "lon": 77.7523, "elevation_m": 343.0,
                "blocks": [
                    {"block": "Morshi", "panchayats_count": 25, "assigned_officer": "Sanjay Kale", "lat": 21.3167, "lon": 78.0167, "elevation_m": 380.0},
                    {"block": "Warud", "panchayats_count": 23, "assigned_officer": "Deepak Raut", "lat": 21.4667, "lon": 78.2667, "elevation_m": 410.0},
                ]
            }
        ]
    },
    {
        "state": "Punjab",
        "code": "PB",
        "languages": ["pa", "hi", "en"],
        "major_crops": ["wheat", "rice", "maize", "cotton"],
        "districts_count": 23,
        "districts": [
            {
                "district": "Ludhiana",
                "lat": 30.9010, "lon": 75.8573, "elevation_m": 256.0,
                "blocks": [
                    {"block": "Jagraon", "panchayats_count": 28, "assigned_officer": "Gurpreet Singh", "lat": 30.7853, "lon": 75.4789, "elevation_m": 240.0},
                    {"block": "Khanna", "panchayats_count": 24, "assigned_officer": "Harpreet Kaur", "lat": 30.7028, "lon": 76.2167, "elevation_m": 254.0},
                ]
            },
            {
                "district": "Bathinda",
                "lat": 30.2110, "lon": 74.9455, "elevation_m": 201.0,
                "blocks": [
                    {"block": "Talwandi Sabo", "panchayats_count": 22, "assigned_officer": "Manjit Dhillon", "lat": 29.9833, "lon": 75.0833, "elevation_m": 210.0},
                ]
            },
            {
                "district": "Moga",
                "lat": 30.8165, "lon": 75.1717, "elevation_m": 217.0,
                "blocks": [
                    {"block": "Baghapurana", "panchayats_count": 21, "assigned_officer": "Jaswinder Brar", "lat": 30.6833, "lon": 75.1167, "elevation_m": 220.0},
                ]
            }
        ]
    },
    {
        "state": "Haryana",
        "code": "HR",
        "languages": ["hi", "en"],
        "major_crops": ["wheat", "rice", "mustard", "sugarcane", "cotton"],
        "districts_count": 22,
        "districts": [
            {
                "district": "Karnal",
                "lat": 29.6857, "lon": 76.9905, "elevation_m": 252.0,
                "blocks": [
                    {"block": "Nilokheri", "panchayats_count": 26, "assigned_officer": "Virender Malik", "lat": 29.8333, "lon": 76.9167, "elevation_m": 250.0},
                    {"block": "Gharaunda", "panchayats_count": 22, "assigned_officer": "Rakesh Dahiya", "lat": 29.5333, "lon": 76.9667, "elevation_m": 248.0},
                ]
            },
            {
                "district": "Hisar",
                "lat": 29.1492, "lon": 75.7217, "elevation_m": 215.0,
                "blocks": [
                    {"block": "Hansi", "panchayats_count": 25, "assigned_officer": "Satish Punia", "lat": 29.1000, "lon": 75.9667, "elevation_m": 218.0},
                ]
            }
        ]
    },
    {
        "state": "Madhya Pradesh",
        "code": "MP",
        "languages": ["hi", "en"],
        "major_crops": ["soybean", "wheat", "chickpea", "mustard", "cotton"],
        "districts_count": 55,
        "districts": [
            {
                "district": "Indore",
                "lat": 22.7196, "lon": 75.8577, "elevation_m": 553.0,
                "blocks": [
                    {"block": "Depalpur", "panchayats_count": 32, "assigned_officer": "Anurag Chouhan", "lat": 22.8500, "lon": 75.5500, "elevation_m": 540.0},
                    {"block": "Sanwer", "panchayats_count": 28, "assigned_officer": "Pooja Patel", "lat": 22.9833, "lon": 75.8333, "elevation_m": 530.0},
                ]
            },
            {
                "district": "Ujjain",
                "lat": 23.1765, "lon": 75.7885, "elevation_m": 491.0,
                "blocks": [
                    {"block": "Ghatiya", "panchayats_count": 24, "assigned_officer": "Mohan Verma", "lat": 23.2833, "lon": 75.8000, "elevation_m": 495.0},
                ]
            }
        ]
    },
    {
        "state": "Uttar Pradesh",
        "code": "UP",
        "languages": ["hi", "en"],
        "major_crops": ["wheat", "rice", "sugarcane", "potato", "mustard"],
        "districts_count": 75,
        "districts": [
            {
                "district": "Varanasi",
                "lat": 25.3176, "lon": 82.9739, "elevation_m": 80.0,
                "blocks": [
                    {"block": "Pindra", "panchayats_count": 26, "assigned_officer": "Ashok Pandey", "lat": 25.4833, "lon": 82.8500, "elevation_m": 83.0},
                    {"block": "Araziline", "panchayats_count": 30, "assigned_officer": "Sunil Yadav", "lat": 25.2667, "lon": 82.8833, "elevation_m": 81.0},
                ]
            },
            {
                "district": "Lucknow",
                "lat": 26.8467, "lon": 80.9462, "elevation_m": 123.0,
                "blocks": [
                    {"block": "Bakshi Ka Talab", "panchayats_count": 25, "assigned_officer": "Manoj Tiwari", "lat": 27.0167, "lon": 80.9167, "elevation_m": 125.0},
                ]
            }
        ]
    },
    {
        "state": "Rajasthan",
        "code": "RJ",
        "languages": ["hi", "en"],
        "major_crops": ["mustard", "wheat", "chickpea", "pearl millet", "cotton"],
        "districts_count": 50,
        "districts": [
            {
                "district": "Jaipur",
                "lat": 26.9124, "lon": 75.7873, "elevation_m": 431.0,
                "blocks": [
                    {"block": "Chomu", "panchayats_count": 28, "assigned_officer": "Bhupender Meena", "lat": 27.1667, "lon": 75.7167, "elevation_m": 435.0},
                    {"block": "Sanganer", "panchayats_count": 24, "assigned_officer": "Radhe Sharma", "lat": 26.8000, "lon": 75.7667, "elevation_m": 425.0},
                ]
            }
        ]
    },
    {
        "state": "Gujarat",
        "code": "GJ",
        "languages": ["gu", "hi", "en"],
        "major_crops": ["cotton", "groundnut", "wheat", "castor"],
        "districts_count": 33,
        "districts": [
            {
                "district": "Rajkot",
                "lat": 22.3039, "lon": 70.8022, "elevation_m": 128.0,
                "blocks": [
                    {"block": "Gondal", "panchayats_count": 27, "assigned_officer": "Pravin Jadeja", "lat": 21.9667, "lon": 70.8000, "elevation_m": 132.0},
                ]
            }
        ]
    },
    {
        "state": "Karnataka",
        "code": "KA",
        "languages": ["kn", "hi", "en"],
        "major_crops": ["rice", "ragi", "sugarcane", "maize", "cotton"],
        "districts_count": 31,
        "districts": [
            {
                "district": "Mandya",
                "lat": 12.5230, "lon": 76.8967, "elevation_m": 678.0,
                "blocks": [
                    {"block": "Pandavapura", "panchayats_count": 26, "assigned_officer": "Ramesh Gowda", "lat": 12.4936, "lon": 76.6697, "elevation_m": 692.0},
                    {"block": "Maddur", "panchayats_count": 22, "assigned_officer": "Suresh Kumar", "lat": 12.5847, "lon": 77.0450, "elevation_m": 662.0},
                ]
            }
        ]
    },
    {
        "state": "Bihar",
        "code": "BR",
        "languages": ["hi", "en"],
        "major_crops": ["rice", "wheat", "maize", "pulses"],
        "districts_count": 38,
        "districts": [
            {
                "district": "Patna",
                "lat": 25.5941, "lon": 85.1376, "elevation_m": 53.0,
                "blocks": [
                    {"block": "Bihta", "panchayats_count": 26, "assigned_officer": "Arvind Kumar", "lat": 25.5667, "lon": 84.8667, "elevation_m": 55.0},
                ]
            }
        ]
    }
]

CROPS_METADATA: list[dict] = [
    {
        "crop_id": "soybean",
        "name": "Soybean",
        "name_hi": "सोयाबीन",
        "name_mr": "सोयाबीन",
        "supported_states": ["MH", "MP", "RJ", "KA"],
        "growth_stages": [
            {"stage_name": "Sowing & Germination", "stage_name_hi": "बुवाई एवं अंकुरण", "stage_name_mr": "पेरणी व उगवण", "approx_days": "0-7 days", "vulnerability_notes": "High sensitivity to heavy downpours leading to seed rot"},
            {"stage_name": "Vegetative Growth", "stage_name_hi": "वानस्पतिक वृद्धि", "stage_name_mr": "शाकीय वाढ", "approx_days": "8-35 days", "vulnerability_notes": "Stem fly risk during high humidity; moderate moisture requirement"},
            {"stage_name": "Flowering", "stage_name_hi": "फूल आना", "stage_name_mr": "फुलोरा अवस्था", "approx_days": "36-55 days", "vulnerability_notes": "Extreme moisture stress or waterlogging causes flower drop"},
            {"stage_name": "Pod Formation & Filling", "stage_name_hi": "फली विकास व दाना भराव", "stage_name_mr": "शेंगा भरणे", "approx_days": "56-80 days", "vulnerability_notes": "Critical water requirement; avoid pesticide spray 14d before harvest"},
            {"stage_name": "Maturity & Harvesting", "stage_name_hi": "परिपक्वता व कटाई", "stage_name_mr": "पक्वता व काढणी", "approx_days": "81-100 days", "vulnerability_notes": "Rainfall delays mechanical threshing and increases pod shattering"},
        ],
        "critical_weather_thresholds": {
            "max_daily_rainfall_mm": "50.0",
            "optimal_temp_range": "20°C - 32°C",
            "critical_humidity_pct": "85%",
        }
    },
    {
        "crop_id": "cotton",
        "name": "Cotton",
        "name_hi": "कपास",
        "name_mr": "कापूस",
        "supported_states": ["MH", "GJ", "PB", "TG", "KA"],
        "growth_stages": [
            {"stage_name": "Seedling", "stage_name_hi": "अंकुरण अवस्था", "stage_name_mr": "रोपवाटिका अवस्था", "approx_days": "0-15 days", "vulnerability_notes": "Susceptible to soil crusting after sudden intense showers"},
            {"stage_name": "Square Formation", "stage_name_hi": "कलियां बनना", "stage_name_mr": "पात्या लागणे", "approx_days": "16-50 days", "vulnerability_notes": "Sucking pests active in cloudy, warm conditions"},
            {"stage_name": "Boll Development", "stage_name_hi": "टेंडू / गूलर विकास", "stage_name_mr": "बोंड भरणे", "approx_days": "51-110 days", "vulnerability_notes": "Pink bollworm monitoring required; avoid stagnant water"},
            {"stage_name": "Bursting & Picking", "stage_name_hi": "कपास चुगाई", "stage_name_mr": "कापूस वेचणी", "approx_days": "111-160 days", "vulnerability_notes": "Rain spoils lint quality and color grade"},
        ],
        "critical_weather_thresholds": {
            "max_daily_rainfall_mm": "40.0",
            "optimal_temp_range": "24°C - 35°C",
            "critical_humidity_pct": "80%",
        }
    },
    {
        "crop_id": "wheat",
        "name": "Wheat",
        "name_hi": "गेहूं",
        "name_mr": "गहू",
        "supported_states": ["PB", "MH", "MP", "UP", "RJ"],
        "growth_stages": [
            {"stage_name": "Crown Root Initiation", "stage_name_hi": "मुकुट जड़ अवस्था (CRI)", "stage_name_mr": "मुकुट मुळे फुटणे", "approx_days": "20-25 days", "vulnerability_notes": "Critical irrigation stage; frost tolerance high"},
            {"stage_name": "Tillering & Jointing", "stage_name_hi": "कल्ले फूटना", "stage_name_mr": "फुटवे फुटणे", "approx_days": "26-55 days", "vulnerability_notes": "Requires cool ambient nights for maximum tiller survival"},
            {"stage_name": "Heading & Flowering", "stage_name_hi": "बाली निकलना व फूल", "stage_name_mr": "ओंब्या येणे", "approx_days": "56-80 days", "vulnerability_notes": "Terminal heat (>32°C) severely impacts grain filling"},
            {"stage_name": "Dough & Ripening", "stage_name_hi": "दाना पकना", "stage_name_mr": "दाणे पक्वता", "approx_days": "81-110 days", "vulnerability_notes": "Strong winds with rain cause crop lodging"},
        ],
        "critical_weather_thresholds": {
            "max_daily_rainfall_mm": "25.0",
            "optimal_temp_range": "15°C - 25°C",
            "critical_humidity_pct": "75%",
        }
    },
    {
        "crop_id": "orange",
        "name": "Nagpur Mandarin Orange",
        "name_hi": "नागपुरी संतरा",
        "name_mr": "नागपूर संत्री",
        "supported_states": ["MH", "RJ"],
        "growth_stages": [
            {"stage_name": "Ambia / Mrig Bahar Flowering", "stage_name_hi": "बहार पुष्पन", "stage_name_mr": "बहार फुलोरा", "approx_days": "Variable", "vulnerability_notes": "Strict water stress required before induced irrigation"},
            {"stage_name": "Fruit Set & Marble Size", "stage_name_hi": "फल विकास (मार्बल अवस्था)", "stage_name_mr": "फळधारणा (गोळी अवस्था)", "approx_days": "30-75 days", "vulnerability_notes": "High temperature causes fruit drop; basin mulching advised"},
            {"stage_name": "Fruit Enlargement", "stage_name_hi": "फल विकास", "stage_name_mr": "फळांचा आकार वाढणे", "approx_days": "76-180 days", "vulnerability_notes": "Phytophthora gummosis risk under poor root aeration"},
            {"stage_name": "Color Break & Harvest", "stage_name_hi": "परिपक्वता व तुड़ाई", "stage_name_mr": "रंग बदलणे व काढणी", "approx_days": "181-240 days", "vulnerability_notes": "Pre-harvest fruit drop triggered by unseasonal showers"},
        ],
        "critical_weather_thresholds": {
            "max_daily_rainfall_mm": "60.0",
            "optimal_temp_range": "20°C - 35°C",
            "critical_humidity_pct": "85%",
        }
    }
]


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------


@router.get("/states", response_model=list[StateConfigOut])
def list_states():
    """List supported Indian states with language and crop metadata."""
    return [
        StateConfigOut(
            state=s["state"],
            code=s["code"],
            languages=s["languages"],
            major_crops=s["major_crops"],
            districts_count=s["districts_count"],
        )
        for s in STATES_DATA
    ]


@router.get("/districts", response_model=list[DistrictItemOut])
def list_districts(state_code: str = "MH"):
    """List districts within a state."""
    state = next((s for s in STATES_DATA if s["code"].upper() == state_code.upper()), None)
    if not state:
        raise HTTPException(status_code=404, detail=f"State {state_code} not found")
    
    return [
        DistrictItemOut(
            district=d["district"],
            state_code=state["code"],
            blocks_count=len(d["blocks"]),
            panchayats_count=sum(b["panchayats_count"] for b in d["blocks"]),
        )
        for d in state["districts"]
    ]


@router.get("/blocks", response_model=list[BlockItemOut])
def list_blocks(district: str = "Nagpur"):
    """List sub-district blocks within a district."""
    for s in STATES_DATA:
        for d in s["districts"]:
            if d["district"].lower() == district.lower():
                return [
                    BlockItemOut(
                        block=b["block"],
                        district=d["district"],
                        panchayats_count=b["panchayats_count"],
                        assigned_officer=b.get("assigned_officer"),
                    )
                    for b in d["blocks"]
                ]
    raise HTTPException(status_code=404, detail=f"District {district} not found")


@router.get("/panchayats", response_model=list[PanchayatHierarchyOut])
def list_panchayats_hierarchy(
    block: Optional[str] = None,
    district: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List Gram Panchayats with geographic coordinates and assigned extension officer."""
    q = db.query(Panchayat)
    if block:
        q = q.filter(Panchayat.block.ilike(f"%{block}%"))
    if district:
        q = q.filter(Panchayat.district.ilike(f"%{district}%"))
    
    panchayats = q.all()
    
    # Map officer based on block
    officer_map = {
        "Kalmeshwar": "Rajesh Sharma",
        "Hingna": "Sunita Patil",
        "Saoner": "Vikas Deshmukh",
        "Katol": "Anil Thakre",
        "Jagraon": "Gurpreet Singh",
        "Pandavapura": "Ramesh Gowda",
    }
    
    return [
        PanchayatHierarchyOut(
            id=p.id,
            name=p.name,
            block=p.block,
            district=p.district,
            state=p.state,
            lat=p.lat,
            lng=p.lng,
            elevation_m=p.elevation_m,
            assigned_officer=officer_map.get(p.block, "Rajesh Sharma"),
            registered_farmers=75 + (p.id * 7) % 60,
            primary_crops=["soybean", "cotton"] if p.block in ["Kalmeshwar", "Saoner"] else ["orange", "chickpea"],
            telemetry_status="FRESH" if p.id % 5 != 0 else "DELAYED",
            last_sync="10:30 AM",
            weather_status_text="0.1 mm (Clear)" if p.id % 2 == 0 else "1.2 mm (Scattered)",
            advisory_status="Approved" if p.id % 3 == 0 else "Pending",
            model_state="Normal (XGB-03)",
        )
        for p in panchayats
    ]


@router.get("/crops", response_model=list[CropMetadataOut])
def list_crops(state_code: Optional[str] = None):
    """List agronomic crop metadata, growth stages, and threshold rules."""
    if state_code:
        filtered = [c for c in CROPS_METADATA if state_code.upper() in c["supported_states"]]
        return [CropMetadataOut(**c) for c in filtered]
    return [CropMetadataOut(**c) for c in CROPS_METADATA]


import httpx
import logging

logger = logging.getLogger(__name__)


@router.get("/search")
async def search_locations(
    q: str = Query(..., min_length=2, description="Search term for city, town, village, block, or district in India"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Search any location in India.
    Combines local database + curated pan-India agrarian directory + Open-Meteo Geocoding for India (country_code=IN).
    """
    results = []
    q_norm = q.strip().lower()

    # 1. Search local DB Panchayats
    try:
        db_panchayats = db.query(Panchayat).filter(
            (Panchayat.name.ilike(f"%{q_norm}%")) |
            (Panchayat.block.ilike(f"%{q_norm}%")) |
            (Panchayat.district.ilike(f"%{q_norm}%"))
        ).limit(limit).all()
        for p in db_panchayats:
            results.append({
                "id": f"p_{p.id}",
                "name": p.name,
                "type": "PANCHAYAT",
                "block": p.block,
                "district": p.district,
                "state": p.state,
                "lat": p.lat,
                "lon": p.lng,
                "elevation_m": p.elevation_m or 310.0,
                "display_label": f"{p.name} (ग्राम पंचायत) · {p.block}, {p.district}",
            })
    except Exception as e:
        logger.warning(f"DB search error: {e}")

    # 2. Search curated STATES_DATA (Districts & Blocks across India)
    for s in STATES_DATA:
        state_name = s["state"]
        for d in s["districts"]:
            dist_name = d["district"]
            if q_norm in dist_name.lower():
                results.append({
                    "id": f"d_{dist_name.lower()}",
                    "name": dist_name,
                    "type": "DISTRICT",
                    "block": dist_name,
                    "district": dist_name,
                    "state": state_name,
                    "lat": d.get("lat", 21.0),
                    "lon": d.get("lon", 78.0),
                    "elevation_m": d.get("elevation_m", 300.0),
                    "display_label": f"{dist_name} District · {state_name}",
                })
            for b in d.get("blocks", []):
                blk_name = b["block"]
                if q_norm in blk_name.lower():
                    results.append({
                        "id": f"b_{blk_name.lower()}",
                        "name": blk_name,
                        "type": "BLOCK",
                        "block": blk_name,
                        "district": dist_name,
                        "state": state_name,
                        "lat": b.get("lat", d.get("lat", 21.0)),
                        "lon": b.get("lon", d.get("lon", 78.0)),
                        "elevation_m": b.get("elevation_m", d.get("elevation_m", 300.0)),
                        "display_label": f"{blk_name} Block · {dist_name}, {state_name}",
                    })

    # 3. Fallback / Augment via Open-Meteo Geocoding for India (covers ALL villages, tehsils, and towns in India)
    if len(results) < limit:
        try:
            async with httpx.AsyncClient(verify=False, timeout=3.5) as client:
                res = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={
                        "name": q.strip(),
                        "count": limit,
                        "language": "en",
                        "format": "json",
                        "country_code": "IN",
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("results", []):
                        name = item.get("name", "")
                        state = item.get("admin1") or item.get("country", "India")
                        district = item.get("admin2") or name
                        block = item.get("admin3") or district
                        lat = item.get("latitude")
                        lon = item.get("longitude")
                        elevation = item.get("elevation", 250.0)

                        label = f"{name} · {district}, {state}"
                        results.append({
                            "id": f"om_{item.get('id', hash((lat, lon)))}",
                            "name": name,
                            "type": "TOWN_VILLAGE",
                            "block": block,
                            "district": district,
                            "state": state,
                            "lat": lat,
                            "lon": lon,
                            "elevation_m": elevation,
                            "display_label": label,
                        })
        except Exception as e:
            logger.warning(f"Open-Meteo Geocoding fetch error: {e}")

    # Deduplicate by (lat, lon) within tolerance
    deduped = []
    seen_coords = set()
    for r in results:
        key = (round(r["lat"], 3), round(r["lon"], 3))
        if key not in seen_coords:
            seen_coords.add(key)
            deduped.append(r)
        if len(deduped) >= limit:
            break

    return {"query": q, "total": len(deduped), "results": deduped}

