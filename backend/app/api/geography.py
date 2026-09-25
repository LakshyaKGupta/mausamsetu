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
                "blocks": [
                    {"block": "Kalmeshwar", "panchayats_count": 24, "assigned_officer": "Rajesh Sharma"},
                    {"block": "Hingna", "panchayats_count": 20, "assigned_officer": "Sunita Patil"},
                    {"block": "Saoner", "panchayats_count": 18, "assigned_officer": "Vikas Deshmukh"},
                    {"block": "Katol", "panchayats_count": 16, "assigned_officer": "Anil Thakre"},
                ]
            },
            {
                "district": "Wardha",
                "blocks": [
                    {"block": "Deoli", "panchayats_count": 22, "assigned_officer": "Pradeep Rane"},
                    {"block": "Arvi", "panchayats_count": 19, "assigned_officer": "Kavita Shinde"},
                ]
            },
            {
                "district": "Amravati",
                "blocks": [
                    {"block": "Morshi", "panchayats_count": 25, "assigned_officer": "Sanjay Kale"},
                    {"block": "Warud", "panchayats_count": 23, "assigned_officer": "Deepak Raut"},
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
                "blocks": [
                    {"block": "Jagraon", "panchayats_count": 28, "assigned_officer": "Gurpreet Singh"},
                    {"block": "Khanna", "panchayats_count": 24, "assigned_officer": "Harpreet Kaur"},
                ]
            },
            {
                "district": "Moga",
                "blocks": [
                    {"block": "Baghapurana", "panchayats_count": 21, "assigned_officer": "Jaswinder Brar"},
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
                "blocks": [
                    {"block": "Pandavapura", "panchayats_count": 26, "assigned_officer": "Ramesh Gowda"},
                    {"block": "Maddur", "panchayats_count": 22, "assigned_officer": "Suresh Kumar"},
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
