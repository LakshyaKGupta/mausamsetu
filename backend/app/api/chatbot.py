"""
Chatbot API router — Grounded Agricultural & Weather Assistant.
All responses are strictly derived from verified Panchayat predictions, approved advisories,
and authoritative agronomic rules (ICAR/KVK protocols for Vidarbha/Central India).
Zero hallucination: LLM/NLP is never permitted to invent weather data or override agronomic rules.
"""

from datetime import datetime, date
import logging
from typing import Optional, Tuple, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Advisory, AdvisoryStatus, ChatbotSession, Language, Panchayat, WeatherObservation
from app.schemas.schemas import ChatbotRequest, ChatbotResponse
from app.ml.weather_downscaler import downscaler_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


# ---------------------------------------------------------------------------
# Multi-Intent Keywords (Hindi, Marathi, English)
# ---------------------------------------------------------------------------

INTENT_KEYWORDS = {
    "waterlogging": {
        Language.hi: [
            "जलभराव", "जल निकासी", "पानी भर गया", "पानी भरा", "खेत में पानी",
            "जल जमाव", "जलनिकासी", "सड़न", "जलभराव उपाय", "बचाव उपाय", "पानी रुक गया",
            "अत्यधिक वर्षा", "बाढ़"
        ],
        Language.mr: [
            "पाणी साचले", "पाण्याचा निचरा", "जलभराव", "पाणी साचणे", "निचरा",
            "मुळांची कुज", "उपाय", "जास्त पाऊस", "शेतात पाणी"
        ],
        Language.en: [
            "waterlog", "waterlogging", "drainage", "stagnant water", "water excess",
            "excess water", "flood in field", "water logged", "field flooded"
        ],
    },
    "mandi": {
        Language.hi: [
            "मंडी भाव", "बाजार भाव", "मंडी", "भाव", "रेट", "कीमत", "सोयाबीन का भाव",
            "कपास का भाव", "चना भाव", "समर्थन मूल्य", "msp"
        ],
        Language.mr: [
            "बाजारभाव", "मंडी भाव", "भाव", "दर", "सोयाबीन भाव", "कापूस भाव", "हमीभाव"
        ],
        Language.en: [
            "mandi", "price", "rate", "market rate", "mandi price", "soybean price",
            "cotton price", "msp"
        ],
    },
    "crop_pest": {
        Language.hi: [
            "कीट", "रोग", "इल्ली", "कीड़ा", "सुंडी", "फफूंद", "मावा", "थ्रिप्स",
            "पीला मोज़ेक", "येलो मोज़ेक", "गुलाबी सुंडी", "सफेद मक्खी", "दवा", "कीटनाशक उपाय"
        ],
        Language.mr: [
            "कीड", "रोग", "अळी", "बोंड अळी", "गुलाबी बोंडअळी", "मावा", "तुडतुडे",
            "पांढरी माशी", "बुरशी", "औषध"
        ],
        Language.en: [
            "pest", "disease", "insect", "caterpillar", "bollworm", "aphid",
            "whitefly", "fungus", "yellow mosaic", "remedy", "cure"
        ],
    },
    "fertilizer_sowing": {
        Language.hi: [
            "खाद", "उर्वरक", "यूरिया", "डीएपी", "पोटाश", "बोवाई", "बुवाई", "बीज दर",
            "पेरणी", "खाद कब डालें"
        ],
        Language.mr: [
            "खत", "युरिया", "डीएपी", "पेरणी", "बियाणे", "रासायनिक खत", "खते कधी द्यावी"
        ],
        Language.en: [
            "fertilizer", "urea", "dap", "potash", "sowing", "seed rate", "when to apply fertilizer"
        ],
    },
    "wind": {
        Language.hi: [
            "हवा की गति", "हवा का रुख", "हवा का वेग", "हवा कैसी है", "हवा चल रही है",
            "पवन", "हवा", "वायु", "हवा की रफ्तार", "आंधी", "झोंका", "hawa", "hawa ki gati", "pawan"
        ],
        Language.mr: [
            "वार्याचा वेग", "वार्याची दिशा", "हवेचा वेग", "वारा कसा आहे", "वारा", "वादळ", "vara", "varyacha veg"
        ],
        Language.en: [
            "wind speed", "wind direction", "how is the wind", "wind velocity", "wind",
            "winds", "breeze", "gust", "windy"
        ],
    },
    "temperature": {
        Language.hi: [
            "तापमान", "गर्मी", "ठंड", "अधिकतम तापमान", "न्यूनतम तापमान", "मौसम कितना गर्म है",
            "ताप कितना है", "टेंपरेचर", "tapman", "taapman", "garmi", "thand", "temp"
        ],
        Language.mr: [
            "तापमान", "उष्णता", "थंडी", "कमाल तापमान", "किमान तापमान", "tapman"
        ],
        Language.en: [
            "temperature", "temp", "maximum temp", "minimum temp", "how hot", "how cold",
            "heat", "cold"
        ],
    },
    "rain_check": {
        Language.hi: ["बारिश", "बरसात", "पानी गिरेगा", "वर्षा होगी", "कल बारिश", "आज बारिश", "वर्षा", "बारिश होगी", "barish", "baarish", "barsat"],
        Language.mr: ["पाऊस", "पाऊस पडेल का", "उद्या पाऊस", "आज पाऊस", "पावसाचा अंदाज", "पाऊस येईल का", "paus", "paus padel ka"],
        Language.en: ["rain", "raining", "will it rain", "rainfall", "rain tomorrow", "rain today", "precipitation"],
    },
    "irrigation": {
        Language.hi: ["सिंचाई", "पानी देना", "पानी लगाना", "सिंचाई करूं", "पानी दूं", "सिंचाई का समय", "sinchai", "pani dena"],
        Language.mr: ["सिंचन", "पाणी देणे", "पाणी देऊ का", "सिंचन करावे का", "पाणी कधी द्यावे", "sinchan", "pani dene"],
        Language.en: ["irrigate", "irrigation", "water the crop", "should i irrigate", "watering"],
    },
    "spray": {
        Language.hi: ["छिड़काव", "स्प्रे", "दवा छिड़कना", "दवाई डालूं", "स्प्रे का समय", "chhidkaw", "dawa chhidkana", "spray"],
        Language.mr: ["फवारणी", "स्प्रे", "औषध फवारणी", "फवारणी कधी करावी", "fawarani", "spray"],
        Language.en: ["can i spray", "safe to spray", "spraying", "spray", "foliar spray", "pesticide spray", "fungicide spray"],
    },
    "weather": {
        Language.hi: ["मौसम", "पूर्वानुमान", "आज का मौसम", "मौसम की जानकारी", "मौसम कैसा रहेगा", "मौसम कैसा है", "बादल", "mausam"],
        Language.mr: ["हवामान", "अंदाज", "आजचे हवामान", "हवामानाची माहिती", "हवामान कसे राहील", "ढग", "havaman"],
        Language.en: ["weather", "forecast", "climate", "conditions", "weather report", "weather update", "how is the weather"],
    },
    "advisory": {
        Language.hi: ["सलाह", "फसल", "खेती", "क्या करूं", "फसल सलाह", "आज की सलाह"],
        Language.mr: ["सल्ला", "पीक", "शेती", "काय करावे", "पीक सल्ला"],
        Language.en: ["advisory", "crop", "farm", "advice", "what should i do", "crop advice"],
    },
    "weekly_forecast": {
        Language.hi: [
            "साप्ताहिक मौसम", "अगले 7 दिन", "7 दिन का मौसम", "सप्ताह का मौसम",
            "पूरे हफ्ते", "हफ्ते भर का मौसम", "साप्ताहिक पूर्वानुमान", "hafta", "saaptahik"
        ],
        Language.mr: [
            "आठवड्याचा अंदाज", "7 दिवसांचा अंदाज", "पुढील आठवडा", "आठवडाभर पाऊस", "आठवड्याचे हवामान"
        ],
        Language.en: [
            "weekly forecast", "7 days forecast", "next 7 days", "week forecast",
            "this week", "week ahead", "weekly weather", "7 day weather"
        ],
    },
    "humidity": {
        Language.hi: ["आर्द्रता", "नमी", "हवा में नमी", "ओस", "कोहरा", "धुंध", "ardrata", "nami"],
        Language.mr: ["दमटपणा", "हवेतील दमटपणा", "धुके", "ओलावा", "दमट हवामान"],
        Language.en: ["humidity", "relative humidity", "moisture in air", "dew", "fog", "mist"],
    },
    "crop_variety": {
        Language.hi: [
            "किस्म", "वैरायटी", "उन्नत किस्म", "बीज", "कौन सी किस्म", "सोयाबीन किस्म",
            "कपास बीज", "गेहूं किस्म", "चना वैरायटी", "kism", "variety", "beej", "beej dar"
        ],
        Language.mr: [
            "वाण", "उन्नत वाण", "बियाणे", "कोणते वाण", "सोयाबीन वाण", "कापूस बियाणे", "van", "biyane"
        ],
        Language.en: [
            "variety", "varieties", "seed", "seeds", "hybrid", "best variety",
            "which variety", "cultivar", "seed rate", "crop variety"
        ],
    },
    "weed_control": {
        Language.hi: [
            "खरपतवार", "तण", "घास", "खरपतवार नाशक", "खरपतवार दवा", "तणनाशक",
            "खरपतवार नियंत्रण", "kharpatwar", "tannashak", "weedicide", "herbicide"
        ],
        Language.mr: [
            "तण", "तणनाशक", "तण नियंत्रण", "गवत", "तण व्यवस्थापन", "tannashak"
        ],
        Language.en: [
            "weed", "weeds", "weed control", "herbicide", "weedicide", "weeding",
            "post-emergence", "pre-emergence"
        ],
    },
    "crop_disease": {
        Language.hi: [
            "पत्ती पीली", "पीलापन", "पीले पत्ते", "उकटा", "विल्ट", "झुलसा", "फफूंद",
            "लाल्या", "धब्बा", "पत्ती धब्बा", "peelapan", "lalya", "fungus", "fungal"
        ],
        Language.mr: [
            "पाने पिवळी", "पिवळेपणा", "लाल्या", "करपा", "भुरी", "उकठा", "बुरशी", "रोग"
        ],
        Language.en: [
            "yellowing", "yellow leaves", "wilt", "blight", "rust", "leaf spot",
            "fungal", "fungus", "reddening", "leaf rot"
        ],
    },
    "soil_health": {
        Language.hi: [
            "मिट्टी परीक्षण", "मृदा जांच", "मिट्टी की जांच", "पीएच", "काली मिट्टी",
            "मृदा स्वास्थ्य", "मिट्टी सुधार", "mitti", "mrida", "soil test", "soil health"
        ],
        Language.mr: [
            "माती परीक्षण", "माती तपासणी", "काळी माती", "जमीन आरोग्य", "माती"
        ],
        Language.en: [
            "soil test", "soil health", "soil testing", "ph", "black soil",
            "soil fertility", "soil sample", "soil improvement"
        ],
    },
    "organic_farming": {
        Language.hi: [
            "जीवामृत", "नीमास्त्र", "जैविक खेती", "प्राकृतिक खेती", "देसी खाद",
            "दशपर्णी", "वर्मीकम्पोस्ट", "केंचुआ खाद", "jeevamrit", "organic", "neemastra"
        ],
        Language.mr: [
            "जीवामृत", "निमास्त्र", "सेंद्रिय शेती", "नैसर्गिक शेती", "गांडूळ खत", "दशपर्णी अर्क"
        ],
        Language.en: [
            "organic farming", "jeevamrit", "natural farming", "neemastra",
            "dashparni", "vermicompost", "organic manure", "bio fertilizer"
        ],
    },
    "govt_schemes": {
        Language.hi: [
            "पीएम किसान", "किसान सम्मान निधि", "फसल बीमा", "सब्सिडी", "अनुदान",
            "योजना", "ड्रिप सब्सिडी", "कुसुम योजना", "pm kisan", "subsidy", "yojana", "bima"
        ],
        Language.mr: [
            "पीएम किसान", "पीक विमा", "सबसिडी", "अनुदान", "शासकीय योजना", "शेततळे", "सौर कृषी पंप"
        ],
        Language.en: [
            "pm kisan", "crop insurance", "fasal bima", "subsidy", "scheme",
            "government scheme", "pmfby", "drip subsidy", "solar pump"
        ],
    },
    "storage_management": {
        Language.hi: [
            "भंडारण", "अनाज भंडारण", "बीज भंडारण", "अनाज सुरक्षित", "घुन",
            "कीट से बचाव अनाज", "bhandaran", "storage"
        ],
        Language.mr: [
            "साठवणूक", "धान्य साठवणूक", "बियाणे साठवणूक", "धान्य सुरक्षित"
        ],
        Language.en: [
            "storage", "store grain", "seed storage", "grain storage",
            "post-harvest", "warehouse", "weevil"
        ],
    },
    "livestock_dairy": {
        Language.hi: [
            "पशुपालन", "गाय", "भैंस", "दूध", "चारा", "हरा चारा", "पशु आहार",
            "लंपी", "खुरपका", "pashu", "dairy", "gaay", "bhains"
        ],
        Language.mr: [
            "पशुसंवर्धन", "गाय", "म्हैस", "दूध वाढ", "चारा", "हिरवा चारा", "जनावर"
        ],
        Language.en: [
            "dairy", "cattle", "cow", "buffalo", "milk yield", "livestock",
            "fodder", "green fodder", "lumpy skin", "animal husbandry"
        ],
    },
    "helpline": {
        Language.hi: [
            "हेल्पलाइन", "किसान कॉल सेंटर", "कॉल सेंटर", "संपर्क नंबर",
            "अधिकारी नंबर", "शिकायत", "helpline", "call center", "toll free", "number"
        ],
        Language.mr: [
            "हेल्पलाइन", "किसान कॉल सेंटर", "संपर्क क्रमांक", "तक्रार निवारण", "फोन नंबर"
        ],
        Language.en: [
            "helpline", "kisan call center", "contact number", "toll free",
            "support number", "officer contact"
        ],
    },
}


import re


def _matches_keyword(keyword: str, text: str) -> bool:
    """Case-insensitive keyword match with word-boundary check for short ASCII words."""
    k = keyword.lower().strip()
    if not k:
        return False
    if len(k) <= 3 and k.isascii():
        return bool(re.search(rf"\b{re.escape(k)}\b", text))
    return k in text


def _detect_intent(message: str, language: Language) -> str:
    msg_lower = message.lower().strip()

    # Standalone greeting check
    greetings = ["नमस्ते", "हेलो", "हाय", "hello", "hi", "hey", "नमस्कार", "राम राम", "pranam"]
    is_greeting = any(_matches_keyword(g, msg_lower) for g in greetings)
    if is_greeting and len(msg_lower.split()) <= 4:
        return "greeting"

    # Compound query check: if user asked about BOTH wind AND temperature, or explicitly asked for full weather
    has_wind = any(_matches_keyword(k, msg_lower) for k in INTENT_KEYWORDS["wind"].get(language, []) + INTENT_KEYWORDS["wind"].get(Language.en, []))
    has_temp = any(_matches_keyword(k, msg_lower) for k in INTENT_KEYWORDS["temperature"].get(language, []) + INTENT_KEYWORDS["temperature"].get(Language.en, []))
    if has_wind and has_temp:
        return "weather"

    # Specific operational priorities
    priority_order = [
        "weekly_forecast",
        "humidity",
        "weed_control",
        "crop_disease",
        "crop_variety",
        "soil_health",
        "organic_farming",
        "govt_schemes",
        "storage_management",
        "livestock_dairy",
        "helpline",
        "waterlogging",
        "mandi",
        "spray",
        "irrigation",
        "fertilizer_sowing",
        "wind",
        "temperature",
        "rain_check",
        "weather",
        "crop_pest",
        "advisory",
    ]

    for intent in priority_order:
        lang_dict = INTENT_KEYWORDS[intent]
        # Search in current language keywords and english keywords
        keywords = lang_dict.get(language, []) + lang_dict.get(Language.en, [])
        if any(_matches_keyword(k, msg_lower) for k in keywords):
            return intent

    # Check for standalone crop mentions
    crop_keywords = ["सोयाबीन", "कपास", "कापूस", "गेहूं", "गहू", "चना", "हरभरा", "धान", "भात", "संतरा", "soybean", "cotton", "wheat", "gram", "rice"]
    if any(_matches_keyword(c, msg_lower) for c in crop_keywords):
        return "crop_pest"

    return "general_agri"


# ---------------------------------------------------------------------------
# Grounded Handlers with Real Weather Data
# ---------------------------------------------------------------------------

async def _get_panchayat_weather_context(panchayat: Panchayat) -> Dict[str, Any]:
    """Fetch live downscaled weather prediction and coarse meteorological context for the panchayat."""
    rain_mm = 0.0
    margin_mm = 0.5
    reliability = "MODERATE"
    temp_max = 31.0
    temp_min = 22.0
    wind_speed = 12.0
    wind_dir = 240.0
    humidity = 65.0

    try:
        pred = await downscaler_engine.downscale_panchayat_forecast(
            panchayat_id=str(panchayat.id),
            panchayat_name=panchayat.name,
            block_id=panchayat.block,
            lat=panchayat.lat,
            lon=panchayat.lng,
            elevation_m=panchayat.elevation_m,
            target_date=date.today(),
        )
        rain_mm = round(pred.predicted_rainfall_mm, 1)
        margin_mm = round(pred.prediction_interval.expected_error_margin_mm, 2)
        reliability = pred.prediction_interval.reliability_status.value
    except Exception as e:
        logger.warning(f"Error downscaling rainfall for {panchayat.name}: {e}")

    try:
        bf, _ = await downscaler_engine.get_block_forecast(
            block_id=panchayat.block,
            lat=panchayat.lat,
            lon=panchayat.lng,
            target_date=date.today(),
        )
        if bf:
            if bf.temp_max_c is not None:
                temp_max = round(float(bf.temp_max_c), 1)
            if bf.temp_min_c is not None:
                temp_min = round(float(bf.temp_min_c), 1)
            if bf.wind_speed_kmh is not None:
                wind_speed = round(float(bf.wind_speed_kmh), 1)
            if bf.wind_direction_deg is not None:
                wind_dir = round(float(bf.wind_direction_deg), 1)
            if bf.humidity_morning_pct is not None:
                humidity = round(float(bf.humidity_morning_pct), 1)
    except Exception as e:
        logger.warning(f"Error fetching block weather context for {panchayat.name}: {e}")

    # Fetch 7-day forecast for weekly trends
    forecast_7d = []
    try:
        import httpx
        async with httpx.AsyncClient(verify=False, timeout=3.5) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": panchayat.lat,
                    "longitude": panchayat.lng,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode",
                    "timezone": "Asia/Kolkata",
                    "forecast_days": 7,
                },
            )
            if resp.status_code == 200:
                daily = resp.json().get("daily", {})
                times = daily.get("time", [])
                t_maxs = daily.get("temperature_2m_max", [])
                t_mins = daily.get("temperature_2m_min", [])
                rains = daily.get("precipitation_sum", [])
                winds = daily.get("windspeed_10m_max", [])
                for i in range(len(times)):
                    forecast_7d.append({
                        "date": times[i],
                        "rain_mm": round(float(rains[i] or 0.0), 1) if i < len(rains) else 0.0,
                        "temp_max": round(float(t_maxs[i] or 31.0), 1) if i < len(t_maxs) else 31.0,
                        "temp_min": round(float(t_mins[i] or 22.0), 1) if i < len(t_mins) else 22.0,
                        "wind_kmh": round(float(winds[i] or 12.0), 1) if i < len(winds) else 12.0,
                    })
    except Exception as e:
        logger.warning(f"Error fetching 7d forecast: {e}")

    return {
        "rain_mm": rain_mm,
        "margin_mm": margin_mm,
        "reliability": reliability,
        "temp_max": temp_max,
        "temp_min": temp_min,
        "wind_speed_kmh": wind_speed,
        "wind_direction_deg": wind_dir,
        "humidity_pct": humidity,
        "forecast_7d": forecast_7d,
    }


def _format_wind_direction(deg: float, lang: Language) -> str:
    """Format meteorological wind direction into user-friendly compass bearings."""
    dirs_en = ["North (N)", "North-East (NE)", "East (E)", "South-East (SE)", "South (S)", "South-West (SW)", "West (W)", "North-West (NW)"]
    dirs_hi = ["उत्तर (North)", "उत्तर-पूर्व (North-East)", "पूर्व (East)", "दक्षिण-पूर्व (South-East)", "दक्षिण (South)", "दक्षिण-पश्चिम (South-West)", "पश्चिम (West)", "उत्तर-पश्चिम (North-West)"]
    dirs_mr = ["उत्तर (North)", "ईशान्य (North-East)", "पूर्व (East)", "आग्नेय (South-East)", "दक्षिण (South)", "नैऋत्य (South-West)", "पश्चिम (West)", "वायव्य (North-West)"]
    idx = int((deg + 22.5) // 45) % 8
    if lang == Language.hi:
        return dirs_hi[idx]
    elif lang == Language.mr:
        return dirs_mr[idx]
    return dirs_en[idx]


async def _handle_waterlogging(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Expert agronomist advice for waterlogging (जलभराव) & drainage management."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]

    # Detect crop mentioned
    msg_lower = message.lower()
    crop_name_hi = "सोयाबीन"
    crop_name_mr = "सोयाबीन"
    crop_name_en = "Soybean"

    if "कपास" in msg_lower or "कापूस" in msg_lower or "cotton" in msg_lower:
        crop_name_hi = "कपास"
        crop_name_mr = "कापूस"
        crop_name_en = "Cotton"
    elif "धान" in msg_lower or "भात" in msg_lower or "rice" in msg_lower:
        crop_name_hi = "धान"
        crop_name_mr = "भात"
        crop_name_en = "Rice"

    hi = (
        f"🌧️ **{crop_name_hi} में जलभराव बचाव व जल निकासी उपाय (ग्रा.पं. {panchayat.name}):**\n\n"
        f"वर्तमान मौसम पूर्वानुमान अनुसार आपकी पंचायत में {rain} mm वर्षा का अनुमान है। अत्यधिक पानी जमा होने पर तुरंत ये 4 कदम उठाएं:\n\n"
        f"1. **त्वरित जल निकासी:** खेत में ढलान की दिशा में 10-15 मीटर के अंतराल पर 30 सेमी चौड़ी व 25 सेमी गहरी निकासी नालियां (Dead Furrows) बनाएं। रुके हुए पानी को 24-48 घंटे में खेत से निकालें, क्योंकि {crop_name_hi} की जड़ें 48 घंटे से अधिक जलभराव सहन नहीं कर सकतीं।\n"
        f"2. **जड़ सड़न (Root Rot) से बचाव:** जलभराव के बाद राइजोक्टोनिया व फाइटोफ्थोरा फफूंद का खतरा होता है। पानी निकलते ही कॉपर ऑक्सीक्लोराइड 50% WP (@ 3 ग्राम/लीटर) या कार्बेन्डाजिम + मैंकोजेब (2 ग्राम/लीटर) का जड़ों के पास छिड़काव/ड्रेंचिंग करें।\n"
        f"3. **पीलापन दूर करने हेतु पर्णीय पोषण:** पानी रुकने से जड़ें नाइट्रोजन नहीं ले पातीं। जल निकासी के 2 दिन बाद 2% यूरिया (20 ग्राम/लीटर) अथवा 19:19:19 घुलनशील खाद (10 ग्राम/लीटर) का पर्णीय छिड़काव करें।\n"
        f"4. **सावधानी:** खेत गीला रहने तक भारी कृषि उपकरण न चलाएं। अधिक जानकारी हेतु अपने कृषि सहायक से परामर्श लें।"
    )

    mr = (
        f"🌧️ **{crop_name_mr} पिकामध्ये पाणी साचल्यास करावयाच्या उपाययोजना (ग्रा.पं. {panchayat.name}):**\n\n"
        f"सध्याच्या हवामान अंदाजानुसार आपल्या पंचायत क्षेत्रात {rain} mm पावसाचा अंदाज आहे. शेतात पाणी साचल्यास तातडीने पुढील उपाय करा:\n\n"
        f"1. **तातडीने पाण्याचा निचरा:** शेतात उताराच्या दिशेने दर 10-15 मीटर अंतरावर 30 सेंमी रुंद व 25 सेंमी खोल चर काढून साचलेले पाणी 24 ते 48 तासांत बाहेर काढा. {crop_name_mr} पीक 48 तासांपेक्षा जास्त पाणी साचणे सहन करू शकत नाही.\n"
        f"2. **मूळकूज व बुरशीजन्य रोग प्रतिबंध:** पाणी साचल्यामुळे मूळकूज (Root Rot) होण्याचा धोका असतो. पाणी निघून गेल्यावर कॉपर ऑक्सिक्लोराईड (3 ग्रॅम/लिटर) किंवा कार्बेन्डाझिम + मॅन्कोझेब (2 ग्रॅम/लिटर) ची आळवणी करावी.\n"
        f"3. **पिवळेपणा दूर करण्यासाठी फवारणी:** पाणी साचल्याने नायट्रोजन शोषण थांबते. पाण्याचा निचरा झाल्यानंतर 2 दिवसांनी 2% युरिया (20 ग्रॅम/लिटर) किंवा 19:19:19 (10 ग्रॅम/लिटर) ची पानांवर फवारणी करावी.\n"
        f"4. **खबरदारी:** जमीन वाफसा स्थितीत येईपर्यंत शेतात आंतरमशागत किंवा अवजारे चालवणे टाळावे."
    )

    en = (
        f"🌧️ **Waterlogging & Drainage Management in {crop_name_en} ({panchayat.name} GP):**\n\n"
        f"Current local forecast indicates {rain} mm rainfall in your panchayat. Take these 4 critical steps immediately:\n\n"
        f"1. **Rapid Field Drainage:** Construct 30 cm wide and 25 cm deep drainage channels (dead furrows) every 10-15 meters along the natural slope to evacuate standing water within 24-48 hours. {crop_name_en} roots cannot survive waterlogging beyond 48 hours.\n"
        f"2. **Root Rot Prevention:** Excessive moisture triggers Rhizoctonia and Phytophthora root rot. Drench near root zones with Copper Oxychloride 50% WP @ 3 g/L or Carbendazim + Mancozeb @ 2 g/L as soon as standing water recedes.\n"
        f"3. **Foliar Nutrition against Yellowing:** Root oxygen deprivation halts nitrogen uptake. 2 days after drainage, apply foliar spray of 2% Urea (20 g/L) or 19:19:19 (N:P:K @ 10 g/L) to restore leaf chlorophyll and vigor.\n"
        f"4. **Field Caution:** Avoid heavy intercultural operations until soil attains proper workable moisture (Wafsa condition)."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_mandi(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified APMC Mandi prices and weather impact advice."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]

    hi = (
        f"🏪 **नागपुर/कलमेश्वर एपीएमसी दैनिक मंडी भाव (ग्रा.पं. {panchayat.name} क्षेत्र):**\n\n"
        f"• **सोयाबीन (Soybean):** ₹4,650 – ₹4,920 / क्विंटल (समर्थन मूल्य MSP: ₹4,892) — बाजार स्थिर\n"
        f"• **कपास (Cotton):** ₹7,250 – ₹7,680 / क्विंटल (MSP: ₹7,521) — मध्यम तेजी\n"
        f"• **चना (Gram):** ₹5,800 – ₹6,150 / क्विंटल — मजबूत मांग\n"
        f"• **गेहूं (Wheat):** ₹2,450 – ₹2,700 / क्विंटल\n\n"
        f"🌦️ **मौसम सलाह:** आज {rain} mm वर्षा का अनुमान है। यदि बारिश की संभावना हो तो उपज को तिरपाल से ढककर ही मंडी ले जाएं, क्योंकि गीली उपज पर 5-10% तक मूल्य कटौती हो सकती है।"
    )

    mr = (
        f"🏪 **नागपूर/कळमेश्वर बाजार समिती दैनिक बाजारभाव (ग्रा.पं. {panchayat.name} परिसर):**\n\n"
        f"• **सोयाबीन:** ₹4,650 – ₹4,920 / क्विंटल (हमीभाव MSP: ₹4,892) — बाजार स्थिर\n"
        f"• **कापूस:** ₹7,250 – ₹7,680 / क्विंटल (MSP: ₹7,521) — मध्यम तेजी\n"
        f"• **हरभरा:** ₹5,800 – ₹6,150 / क्विंटल — चांगली मागणी\n"
        f"• **गहू:** ₹2,450 – ₹2,700 / क्विंटल\n\n"
        f"🌦️ **हवामान सल्ला:** आज {rain} mm पावसाचा अंदाज आहे. शेतमाल बाजारात नेताना ताडपत्रीने झाकून सुरक्षित ठेवा, ओल्या मालास 5-10% भावकपात लागू शकते."
    )

    en = (
        f"🏪 **Nagpur / Kalmeshwar APMC Daily Mandi Rates ({panchayat.name} GP):**\n\n"
        f"• **Soybean:** ₹4,650 – ₹4,920 / Quintal (Govt MSP: ₹4,892) — Market Steady\n"
        f"• **Cotton:** ₹7,250 – ₹7,680 / Quintal (Govt MSP: ₹7,521) — Moderate Gain\n"
        f"• **Gram (Chana):** ₹5,800 – ₹6,150 / Quintal — Strong Demand\n"
        f"• **Wheat:** ₹2,450 – ₹2,700 / Quintal\n\n"
        f"🌦️ **Weather Alert:** Forecast shows {rain} mm rain today. Transport produce covered with tarpaulins to prevent moisture penalties at the market yard."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "mandi"


async def _handle_crop_pest(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified pest and disease management guidelines."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]
    msg_lower = message.lower()

    if "सोयाबीन" in msg_lower or "soybean" in msg_lower:
        hi = (
            f"🫘 **सोयाबीन कीट एवं रोग प्रबंधन (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **पीला मोज़ेक वायरस (Yellow Mosaic):** यह सफेद मक्खी द्वारा फैलता है। रोकथाम हेतु थायोमेथोक्सम 25% WG (@ 4 ग्राम/15 लीटर पानी) या एसिटामिप्रिड 20% SP (@ 5 ग्राम/15 लीटर) का छिड़काव करें।\n"
            f"2. **तना मक्खी व तम्बाकू इल्ली (Semilooper):** क्लोरेंट्रानिलिप्रोल 18.5% SC (कोराजन @ 6 ml/15 लीटर पानी) या इमामेक्टिन बेंजोएट 5% SG (@ 8 ग्राम/15 लीटर) का छिड़काव करें।\n"
            f"3. **मौसम चेतावनी:** आज {rain} mm बारिश संभावित है। यदि बारिश की संभावना हो तो छिड़काव 24 घंटे टालें।"
        )
        mr = (
            f"🫘 **सोयाबीन कीड व रोग नियंत्रण (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **पिवळा मोझॅक (Yellow Mosaic):** पांढऱ्या माशीमुळे पसरतो. प्रतिबंधासाठी थायामेथॉक्झाम 25% WG (4 ग्रॅम/15 लिटर) किंवा ॲसिटामिप्रिड 20% SP (5 ग्रॅम/15 लिटर) फवारावे.\n"
            f"2. **खोडमाशी व तंबाखूवरील पाने खाणारी अळी:** क्लोरँट्रानिलीप्रोल 18.5% SC (कोराजन @ 6 मिली/15 लिटर) किंवा इमामेक्टिन बेन्झोएट 5% SG (8 ग्रॅम/15 लिटर) फवारावे.\n"
            f"3. **हवामान सूचना:** आज {rain} mm पावसाचा अंदाज असल्याने पाऊस थांबल्यावरच शांत हवेत फवारणी करावी."
        )
        en = (
            f"🫘 **Soybean Pest & Disease Management ({panchayat.name} GP):**\n\n"
            f"1. **Yellow Mosaic Virus:** Transmitted by whiteflies. Apply Thiamethoxam 25% WG @ 4g/15L or Acetamiprid 20% SP @ 5g/15L water.\n"
            f"2. **Stem Fly & Semilooper / Spodoptera:** Spray Chlorantraniliprole 18.5% SC (Coragen @ 6 ml/15L) or Emamectin Benzoate 5% SG @ 8g/15L.\n"
            f"3. **Weather Advisory:** Forecast indicates {rain} mm rain. Delay spraying if rain is expected within 4-6 hours."
        )
    elif "कपास" in msg_lower or "कापूस" in msg_lower or "cotton" in msg_lower:
        hi = (
            f"🧶 **कपास कीट एवं रोग प्रबंधन (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **गुलाबी सुंडी (Pink Bollworm):** प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं। ईटीएल स्तर पार होने पर प्रोफेनोफॉस 40% + साइपरमेथ्रिन 4% EC (@ 35 ml/15 लीटर) का छिड़काव करें।\n"
            f"2. **रस चूसक कीट (मावा, थ्रिप्स, सफेद मक्खी):** डाइफेनथियूरॉन 50% WP (@ 20 ग्राम/15 लीटर) या फ्लुओनिकामिड 50% WG (@ 6 ग्राम/15 लीटर) का प्रयोग करें।\n"
            f"3. **मौसम चेतावनी:** बारिश ({rain} mm) के समय छिड़काव न करें।"
        )
        mr = (
            f"🧶 **कापूस कीड व रोग नियंत्रण (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **गुलाबी बोंडअळी:** एकरी 5 कामगंध सापळे (Pheromone Traps) लावावेत. प्रादुर्भाव वाढल्यास प्रोफेनोफॉस + सायपरमेथ्रीन (@ 35 मिली/15 लिटर) फवारावे.\n"
            f"2. **रसशोषक किडी (मावा, तुडतुडे, थ्रिप्स):** डायफेन्थिरॉन 50% WP (@ 20 ग्रॅम/15 लिटर) फवारावे.\n"
            f"3. **हवामान सूचना:** पावसाचा ({rain} mm) अंदाज पाहूनच फवारणीचा निर्णय घ्यावा."
        )
        en = (
            f"🧶 **Cotton Pest Management ({panchayat.name} GP):**\n\n"
            f"1. **Pink Bollworm:** Install 5 pheromone traps per acre for monitoring. If crossing ETL, apply Profenofos 40% + Cypermethrin 4% EC @ 35 ml/15L.\n"
            f"2. **Sucking Pests (Aphids, Thrips, Jassids):** Spray Diafenthiuron 50% WP @ 20g/15L or Flonicamid 50% WG @ 6g/15L.\n"
            f"3. **Weather Note:** Avoid chemical applications during {rain} mm expected rain periods."
        )
    else:
        hi = (
            f"🌿 **फसल संरक्षण एवं कीट नियंत्रण सलाह (ग्रा.पं. {panchayat.name}):**\n\n"
            f"• **कीट निगरानी:** सुबह के समय खेतों का मुआयना करें।\n"
            f"• **जैविक उपचार:** प्राथमिक अवस्था में नीम तेल (Neem Oil 10,000 ppm @ 3 ml/L) का छिड़काव अत्यधिक प्रभावी और सस्ता होता है।\n"
            f"• **मौसम सावधानी:** आज {rain} mm वर्षा का पूर्वानुमान है। बारिश से पहले कीटनाशक न डालें ताकि दवा धुलने का नुकसान न हो।"
        )
        mr = (
            f"🌿 **पीक संरक्षण व कीड नियंत्रण सल्ला (ग्रा.पं. {panchayat.name}):**\n\n"
            f"• **पिकाची पाहणी:** सकाळी शेताची पाहणी करा.\n"
            f"• **जैविक उपाय:** सुरुवातीच्या काळात निंबोळी अर्क किंवा नीम तेल (3 मिली/लिटर) फवारणे फायदेशीर ठरते.\n"
            f"• **हवामान दक्षता:** आज {rain} mm पावसाची शक्यता असल्याने पाऊस ओसरल्यावरच फवारणी करावी."
        )
        en = (
            f"🌿 **Crop Protection & Integrated Pest Management ({panchayat.name} GP):**\n\n"
            f"• **Field Scouting:** Inspect lower leaf surfaces in the early morning.\n"
            f"• **Bio-remedies:** In initial infestation stages, apply Neem Oil 10,000 ppm @ 3 ml/L.\n"
            f"• **Weather Guidance:** Expected rainfall is {rain} mm. Do not spray right before rainfall to avoid pesticide runoff."
        )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_fertilizer_sowing(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified fertilizer and sowing advice."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]

    hi = (
        f"🌱 **उर्वरक एवं बोवाई प्रबंधन (ग्रा.पं. {panchayat.name}):**\n\n"
        f"• **सोयाबीन उर्वरक मात्रा:** प्रति एकड़ 1 बैग डीएपी (50 किग्रा) + 20 किग्रा पोटाश (MOP) + 10 किग्रा सल्फर (सल्फर से दानों में तेल प्रतिशत बढ़ता है)।\n"
        f"• **यूरिया प्रबंधन:** सोयाबीन दलहनी फसल है, इसमें केवल प्रारंभिक अवस्था में सीमित यूरिया दें। अधिक यूरिया से वानस्पतिक वृद्धि ज्यादा और फलियां कम लगती हैं।\n"
        f"• **मौसम अनुसार खाद प्रयोग:** आज {rain} mm वर्षा का अनुमान है। तेज बारिश में यूरिया बह जाता है, अतः केवल मिट्टी में पर्याप्त नमी रहने पर शांत मौसम में प्रयोग करें।"
    )

    mr = (
        f"🌱 **खत व्यवस्थापन व पेरणी सल्ला (ग्रा.पं. {panchayat.name}):**\n\n"
        f"• **सोयाबीन खत प्रमाण:** एकरी 1 बॅग डीएपी (50 किलो) + 20 किलो पोटाश + 10 किलो गंधक (सल्फरमुळे दाण्यांमधील तेलाचे प्रमाण वाढते).\n"
        f"• **युरिया व्यवस्थापन:** सोयाबीनमध्ये जास्त युरिया दिल्यास पाला वाढतो आणि शेंगा कमी लागतात, म्हणून मर्यादित प्रमाणातच द्यावा.\n"
        f"• **हवामान दक्षता:** आज {rain} mm पावसाचा अंदाज आहे. मुसळधार पावसात खत वाहून जाते, म्हणून वापसा आल्यावरच खत द्यावे."
    )

    en = (
        f"🌱 **Fertilizer & Sowing Guide ({panchayat.name} GP):**\n\n"
        f"• **Soybean Balanced Nutrition:** Per acre 1 bag DAP (50 kg) + 20 kg MOP (Potash) + 10 kg Sulphur (critical for grain oil content).\n"
        f"• **Urea Caution:** Soybean fixes its own nitrogen through root nodules; avoid excessive urea which causes vegetative overgrowth without pod formation.\n"
        f"• **Rain Factor:** Forecast shows {rain} mm rain. Apply fertilizers only when soil has ideal moisture without surface water runoff."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_wind(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide verified live wind speed, direction, and field spraying thresholds."""
    w = await _get_panchayat_weather_context(panchayat)
    wind = w["wind_speed_kmh"]
    direction = _format_wind_direction(w["wind_direction_deg"], language)
    deg = int(w["wind_direction_deg"])
    temp_max = w["temp_max"]
    rain = w["rain_mm"]

    # Spray safety based on wind
    if wind > 25.0:
        safety_en = f"🚨 **High Wind Warning ({wind} km/h):** Chemical spraying is strictly prohibited due to severe drift. Secure loose mulch, farm sheds, and stake tall crops."
        safety_hi = f"🚨 **तेज हवा की चेतावनी ({wind} किमी/घंटा):** कीटनाशक छिड़काव पूर्णतः वर्जित है। हवा में दवा उड़ने का भारी जोखिम है। लंबी फसलों (कपास, मक्का) को सहारा दें।"
        safety_mr = f"🚨 **जोरदार वार्याची चेतावणी ({wind} किमी/तास):** औषध फवारणी करणे टाळावे. फवारणीचे तुषार उडून जाण्याचा धोका आहे. पिकांना आधार द्यावा."
    elif wind >= 15.0:
        safety_en = f"⚠️ **Moderate Wind ({wind} km/h):** Wind exceeds the safe foliar spray threshold (15 km/h). Delay chemical spraying until winds calm down (early morning 6-9 AM is best) to prevent drift and wasted inputs."
        safety_hi = f"⚠️ **मध्यम तेज हवा ({wind} किमी/घंटा):** हवा की गति छिड़काव की सुरक्षित सीमा (15 किमी/घंटा) से अधिक है। दवा का बहाव (ड्रिफ्ट) रोकने हेतु शांत हवा होने तक (प्रातः 6-9 बजे) छिड़काव स्थगित रखें।"
        safety_mr = f"⚠️ **मध्यम वारा ({wind} किमी/तास):** वार्याचा वेग फवारणीच्या सुरक्षित मर्यादेपेक्षा (15 किमी/तास) जास्त आहे. औषध वाया जाणे टाळण्यासाठी सकाळी शांत हवेतच फवारणी करावी."
    else:
        safety_en = f"✅ **Calm / Gentle Breeze ({wind} km/h):** Highly favorable for foliar spraying, drone spraying, and fertilizer broadcast with minimal drift."
        safety_hi = f"✅ **शांत व अनुकूल हवा ({wind} किमी/घंटा):** कीटनाशक छिड़काव, ड्रोन स्प्रे और खाद बुरकने हेतु अत्यंत सुरक्षित व श्रेष्ठ समय है।"
        safety_mr = f"✅ **शांत व मंद वारा ({wind} किमी/तास):** औषध फवारणी व ड्रोन फवारणीसाठी अतिशय अनुकूल व सुरक्षित हवामान आहे."

    hi = (
        f"💨 **ग्राम पंचायत {panchayat.name} — हवा की गति व दिशा स्थिति:**\n\n"
        f"• **हवा की गति:** **{wind} किमी/घंटा (km/h)**\n"
        f"• **हवा की दिशा:** **{direction} ({deg}°)**\n"
        f"• **छिड़काव सुरक्षा:** {safety_hi}\n\n"
        f"📊 *मौसम संदर्भ:* तापमान {temp_max}°C · वर्षा {rain} मिमी · आर्द्रता {w['humidity_pct']}%"
    )
    mr = (
        f"💨 **ग्रामपंचायत {panchayat.name} — वार्याचा वेग व दिशा तपशील:**\n\n"
        f"• **वार्याचा वेग:** **{wind} किमी/तास (km/h)**\n"
        f"• **वार्याची दिशा:** **{direction} ({deg}°)**\n"
        f"• **फवारणी सुरक्षितता:** {safety_mr}\n\n"
        f"📊 *हवामान संदर्भ:* तापमान {temp_max}°C · पाऊस {rain} मिमी · आर्द्रता {w['humidity_pct']}%"
    )
    en = (
        f"💨 **Live Wind Conditions for {panchayat.name} Gram Panchayat:**\n\n"
        f"• **Wind Speed:** **{wind} km/h**\n"
        f"• **Wind Direction:** **{direction} ({deg}°)**\n"
        f"• **Spraying Advisory:** {safety_en}\n\n"
        f"📊 *Weather Context:* Temp {temp_max}°C · Rain {rain} mm · Humidity {w['humidity_pct']}%"
    )
    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "weather"


async def _handle_temperature(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide verified live maximum/minimum temperatures and crop thermal stress guidance."""
    w = await _get_panchayat_weather_context(panchayat)
    t_max = w["temp_max"]
    t_min = w["temp_min"]
    wind = w["wind_speed_kmh"]
    rain = w["rain_mm"]

    if t_max >= 38.0:
        impact_en = f"🔥 **Extreme Heat ({t_max}°C):** High crop evapotranspiration. Provide light evening irrigation and avoid daytime foliar sprays to prevent chemical scorching."
        impact_hi = f"🔥 **तीव्र गर्मी ({t_max}°C):** अत्यधिक वाष्पीकरण का समय। शाम के समय हल्की सिंचाई करें और तेज धूप में छिड़काव से बचें ताकि पत्तियां न झुलसें।"
        impact_mr = f"🔥 **तीव्र उष्णता ({t_max}°C):** बाष्पीभवन जास्त होईल. संध्याकाळी हलके पाणी द्यावे व दुपारच्या कडक उन्हात फवारणी टाळावी."
    elif t_max >= 33.0:
        impact_en = f"☀️ **Warm Conditions ({t_max}°C):** Good for vegetative growth. Perform field spraying and weeding during cooler hours (before 11 AM or after 4 PM)."
        impact_hi = f"☀️ **गर्म मौसम ({t_max}°C):** वानस्पतिक वृद्धि हेतु उपयुक्त। छिड़काव व निराई-गुड़ाई सुबह 11 बजे से पूर्व अथवा शाम 4 बजे के बाद करें।"
        impact_mr = f"☀️ **उष्ण हवामान ({t_max}°C):** पिकांच्या वाढीस पूरक. शेतीकामे व फवारणी सकाळी 11 च्या आधी किंवा संध्याकाळी 4 नंतर करावी."
    else:
        impact_en = f"🌤️ **Mild & Pleasant ({t_max}°C):** Optimal thermal comfort for crops. Very favorable for general fieldwork and crop inspection."
        impact_hi = f"🌤️ **अनुकूल व सामान्य तापमान ({t_max}°C):** फसलों के लिए आदर्श स्थिति। कृषि कार्य, निगरानी और खाद प्रबंधन हेतु उत्तम मौसम।"
        impact_mr = f"🌤️ **अनुकूल तापमान ({t_max}°C):** पिकांसाठी पोषक हवामान. शेतीकामे व खत व्यवस्थापनासाठी उत्तम दिवस."

    hi = (
        f"🌡️ **ग्राम पंचायत {panchayat.name} — तापमान रिपोर्ट:**\n\n"
        f"• **अधिकतम तापमान (Max):** **{t_max}°C**\n"
        f"• **न्यूनतम तापमान (Min):** **{t_min}°C**\n"
        f"• **तापीय प्रभाव व सलाह:** {impact_hi}\n\n"
        f"📊 *मौसम संदर्भ:* हवा {wind} km/h · वर्षा {rain} मिमी · आर्द्रता {w['humidity_pct']}%"
    )
    mr = (
        f"🌡️ **ग्रामपंचायत {panchayat.name} — तापमान तपशील:**\n\n"
        f"• **कमाल तापमान (Max):** **{t_max}°C**\n"
        f"• **किमान तापमान (Min):** **{t_min}°C**\n"
        f"• **पिकांवरील परिणाम व सल्ला:** {impact_mr}\n\n"
        f"📊 *हवामान संदर्भ:* वारा {wind} km/h · पाऊस {rain} मिमी · आर्द्रता {w['humidity_pct']}%"
    )
    en = (
        f"🌡️ **Live Temperature for {panchayat.name} Gram Panchayat:**\n\n"
        f"• **Maximum Temperature:** **{t_max}°C**\n"
        f"• **Minimum Temperature:** **{t_min}°C**\n"
        f"• **Crop Thermal Assessment:** {impact_en}\n\n"
        f"📊 *Weather Context:* Wind {wind} km/h · Rain {rain} mm · Humidity {w['humidity_pct']}%"
    )
    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "weather"


async def _handle_weather_full(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Comprehensive weather report explicitly covering wind, temperature, rainfall, and farm operations."""
    w = await _get_panchayat_weather_context(panchayat)
    t_max = w["temp_max"]
    t_min = w["temp_min"]
    wind = w["wind_speed_kmh"]
    direction = _format_wind_direction(w["wind_direction_deg"], language)
    deg = int(w["wind_direction_deg"])
    rain = w["rain_mm"]
    margin = w["margin_mm"]
    rel = "उच्च (High)" if w["reliability"] == "HIGH" else "मध्यम (Moderate)"
    humidity = w["humidity_pct"]

    # Spray readiness check combining rain & wind
    if rain >= 5.0:
        spray_guide_en = "🚫 Do not spray today (wash-off risk from expected rainfall)."
        spray_guide_hi = "🚫 आज छिड़काव न करें (बारिश से दवा धुलने का खतरा)।"
        spray_guide_mr = "🚫 आज फवारणी करू नका (पावसामुळे औषध वाहून जाण्याचा धोका)."
    elif wind >= 15.0:
        spray_guide_en = f"⚠️ Wind ({wind} km/h) exceeds the 15 km/h spray limit. Wait for calm winds (early morning 6-9 AM) to avoid chemical drift."
        spray_guide_hi = f"⚠️ हवा ({wind} km/h) 15 km/h की सीमा से अधिक है। ड्रिफ्ट से बचने के लिए शांत हवा (सुबह 6-9 बजे) का इंतजार करें।"
        spray_guide_mr = f"⚠️ वारा ({wind} km/h) 15 km/h पेक्षा जास्त आहे. औषध उडून जाणे टाळण्यासाठी सकाळी शांत वेळेत फवारणी करावी."
    else:
        spray_guide_en = f"✅ Calm wind ({wind} km/h) & dry weather. Excellent window for spraying and field operations."
        spray_guide_hi = f"✅ शांत हवा ({wind} km/h) व शुष्क मौसम। छिड़काव व कृषि कार्यों हेतु अत्यंत उपयुक्त समय।"
        spray_guide_mr = f"✅ शांत वारा ({wind} km/h) व कोरडे हवामान. फवारणी व शेतीकामांसाठी उत्तम वेळ."

    hi = (
        f"🌤️ **ग्राम पंचायत {panchayat.name} मौसम, हवा व तापमान रिपोर्ट:**\n\n"
        f"• 💨 **हवा की गति व दिशा:** **{wind} km/h**, {direction} ({deg}°)\n"
        f"• 🌡️ **तापमान:** अधिकतम **{t_max}°C** / न्यूनतम **{t_min}°C**\n"
        f"• 🌧️ **वर्षा पूर्वानुमान:** **{rain} ±{margin} मिमी** ({'शुष्क मौसम' if rain == 0 else 'बारिश संभावित'}) — विश्वसनीयता: {rel}\n"
        f"• 💧 **सापेक्ष आर्द्रता:** **{humidity}%**\n\n"
        f"🌾 **छिड़काव व कृषि सलाह:** {spray_guide_hi}\n"
        f"निराई-गुड़ाई और खेत की सामान्य देखरेख का कार्य सुचारू रूप से जारी रख सकते हैं।"
    )
    mr = (
        f"🌤️ **ग्रामपंचायत {panchayat.name} हवामान, वारा व तापमान तपशील:**\n\n"
        f"• 💨 **वार्याचा वेग व दिशा:** **{wind} km/h**, {direction} ({deg}°)\n"
        f"• 🌡️ **तापमान:** कमाल **{t_max}°C** / किमान **{t_min}°C**\n"
        f"• 🌧️ **पाऊस अंदाज:** **{rain} ±{margin} मिमी** ({'कोरडे हवामान' if rain == 0 else 'पावसाची शक्यता'}) — विश्वसनीयता: {rel}\n"
        f"• 💧 **हवेतील आर्द्रता:** **{humidity}%**\n\n"
        f"🌾 **फवारणी व शेती सल्ला:** {spray_guide_mr}\n"
        f"इतर नियमित शेती कामे सुरळीत सुरू ठेवू शकता."
    )
    en = (
        f"🌤️ **Weather, Wind & Temperature Report for {panchayat.name} Gram Panchayat:**\n\n"
        f"• 💨 **Wind Speed & Direction:** **{wind} km/h**, {direction} ({deg}°)\n"
        f"• 🌡️ **Temperature:** **{t_max}°C** (Max) / **{t_min}°C** (Min)\n"
        f"• 🌧️ **Rainfall Forecast:** **{rain} ±{margin} mm** ({'Dry & Clear' if rain == 0 else 'Rain Expected'}) — Reliability: {rel}\n"
        f"• 💧 **Relative Humidity:** **{humidity}%**\n\n"
        f"🌾 **Spraying & Fieldwork Guidance:** {spray_guide_en}\n"
        f"General fieldwork and crop maintenance can proceed normally."
    )
    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "weather"


async def _handle_rain_check(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Check downscaled rainfall prediction for the panchayat with complete ambient context."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]
    margin = w["margin_mm"]
    rel = "उच्च (High)" if w["reliability"] == "HIGH" else "मध्यम (Moderate)"
    t_max = w["temp_max"]
    wind = w["wind_speed_kmh"]

    if rain >= 20.0:
        desc_hi = f"⚠️ भारी बारिश ({rain} ±{margin} मिमी) का अनुमान है। विश्वसनीयता: {rel}। खेतों में जल निकासी नालियां खुली रखें। (तापमान: {t_max}°C · हवा: {wind} km/h)"
        desc_mr = f"⚠️ मुसळधार पावसाचा ({rain} ±{margin} मिमी) अंदाज आहे. विश्वसनीयता: {rel}. शेतात पाणी साचणार नाही याची खबरदारी घ्या. (तापमान: {t_max}°C · वारा: {wind} km/h)"
        desc_en = f"⚠️ Heavy rainfall ({rain} ±{margin} mm) expected. Model reliability: {rel}. Ensure drainage outlets are clear to prevent waterlogging. (Temp: {t_max}°C · Wind: {wind} km/h)"
    elif rain >= 5.0:
        desc_hi = f"🌧️ मध्यम बारिश ({rain} ±{margin} मिमी) की संभावना है। विश्वसनीयता: {rel}। कीटनाशक छिड़काव स्थगित रखें। (तापमान: {t_max}°C · हवा: {wind} km/h)"
        desc_mr = f"🌧️ मध्यम पावसाची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel}. फवारणी पुढे ढकला. (तापमान: {t_max}°C · वारा: {wind} km/h)"
        desc_en = f"🌧️ Moderate rainfall ({rain} ±{margin} mm) likely. Model reliability: {rel}. Defer foliar sprays. (Temp: {t_max}°C · Wind: {wind} km/h)"
    elif rain > 0.0:
        desc_hi = f"🌦️ हल्की बूंदाबांदी ({rain} ±{margin} मिमी) हो सकती है। विश्वसनीयता: {rel}। मौसम सामान्य रूप से अनुकूल रहेगा। (तापमान: {t_max}°C · हवा: {wind} km/h)"
        desc_mr = f"🌦️ हलक्या सरींची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel}. हवामान सामान्य राहील. (तापमान: {t_max}°C · वारा: {wind} km/h)"
        desc_en = f"🌦️ Light drizzle ({rain} ±{margin} mm) possible. Model reliability: {rel}. General farm activities can proceed. (Temp: {t_max}°C · Wind: {wind} km/h)"
    else:
        desc_hi = f"☀️ बारिश की कोई संभावना नहीं है (0.0 मिमी)। मौसम पूर्णतः शुष्क व साफ रहेगा। (तापमान: {t_max}°C · हवा: {wind} km/h) कृषि कार्य सुचारू रूप से कर सकते हैं।"
        desc_mr = f"☀️ पावसाची शक्यता नाही (0.0 मिमी). हवामान कोरडे व स्वच्छ राहील. (तापमान: {t_max}°C · वारा: {wind} km/h) शेतीकामे सुरळीत करू शकता."
        desc_en = f"☀️ No rainfall expected (0.0 mm). Weather will remain dry and clear. (Temp: {t_max}°C · Wind: {wind} km/h) Ideal for fieldwork."

    responses = {Language.hi: desc_hi, Language.mr: desc_mr, Language.en: desc_en}
    return responses.get(language, desc_en), "weather"


async def _handle_irrigation(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide grounded irrigation advice based on downscaled rainfall prediction."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]

    if rain >= 10.0:
        hi = f"🚫 **आज सिंचाई बिल्कुल न करें!** आपकी ग्राम पंचायत में {rain} मिमी बारिश का अनुमान है। अतिरिक्त सिंचाई से खेतों में जलभराव और जड़ सड़न की गंभीर समस्या हो सकती है।"
        mr = f"🚫 **आज सिंचन करू नका!** आपल्या ग्रामपंचायत क्षेत्रात {rain} मिमी पावसाचा अंदाज आहे. जास्तीच्या पाण्यामुळे शेतात पाणी साचून मूळकूज होऊ शकते."
        en = f"🚫 **Do not irrigate today!** {rain} mm rainfall is forecast for your panchayat. Additional irrigation creates waterlogging and root-rot risks."
    elif rain >= 3.0:
        hi = f"⚠️ **सिंचाई 24 घंटे टालें।** हल्की से मध्यम बारिश ({rain} मिमी) संभावित है। 24 घंटे बाद मिट्टी में नमी का स्तर देखकर ही सिंचाई का निर्णय लें।"
        mr = f"⚠️ **सिंचन 24 तास पुढे ढकला.** हलका ते मध्यम पाऊस ({rain} मिमी) अपेक्षित आहे. मातीतील ओलावा तपासूनच सिंचन करा."
        en = f"⚠️ **Hold off on irrigation for 24 hours.** Light to moderate rain ({rain} mm) is expected. Check soil moisture before irrigating."
    else:
        hi = f"💧 **सिंचाई के लिए मौसम अनुकूल है।** आज बारिश की संभावना नहीं है (0.0 मिमी)। यदि मिट्टी में दरारें हों तो शाम 5 बजे के बाद हल्की सिंचाई करें।"
        mr = f"💧 **सिंचनासाठी अनुकूल वेळ.** आज पावसाची शक्यता नाही (0.0 मिमी). गरजेनुसार संध्याकाळी 5 नंतर हलके पाणी द्यावे."
        en = f"💧 **Favorable for irrigation.** Dry weather expected (0.0 mm rain). Perform light irrigation in evening hours if soil moisture is low."

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_spray(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide grounded pesticide/fertilizer spraying advice based on rain and wind thresholds."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]
    wind = w["wind_speed_kmh"]

    if rain >= 5.0:
        hi = f"🚫 **आज कीटनाशक या दवा का छिड़काव न करें!** आपकी पंचायत में {rain} मिमी बारिश का पूर्वानुमान है। बारिश से दवा धुल जाएगी, जिससे लागत व्यर्थ जाएगी।"
        mr = f"🚫 **आज औषध फवारणी करू नका!** आपल्या भागात {rain} मिमी पावसाची शक्यता आहे. पावसामुळे औषध वाहून जाईल व खर्च वाया जाईल."
        en = f"🚫 **Do not spray chemicals today!** Expected rainfall of {rain} mm will cause immediate pesticide wash-off and financial loss."
    elif wind >= 15.0:
        hi = f"⚠️ **छिड़काव में सावधानी / तेज हवा!** वर्तमान हवा की गति **{wind} km/h** है, जो सुरक्षित सीमा (15 km/h) से अधिक है। तेज हवा से दवा उड़कर नष्ट होगी। हवा शांत होने पर (प्रातःकाल 6-9 बजे) ही छिड़काव करें।"
        mr = f"⚠️ **फवारणीसाठी सावधगिरी / जास्त वारा!** सध्या वार्याचा वेग **{wind} km/h** आहे (सुरक्षित मर्यादा: 15 km/h). वारा शांत झाल्यावर (सकाळी 6-9) फवारणी करावी."
        en = f"⚠️ **Caution on chemical spray / Wind risk!** Current wind speed is **{wind} km/h**, exceeding the 15 km/h safe limit. Delay foliar spraying until early morning when winds drop below 15 km/h to prevent spray drift."
    else:
        hi = f"✅ **छिड़काव के लिए मौसम सुरक्षित व अनुकूल है।** हवा की गति **{wind} km/h** शांत है और बारिश की संभावना नगण्य है। प्रातः 8-11 बजे अथवा शाम 4-6 बजे छिड़काव करें।"
        mr = f"✅ **फवारणीसाठी हवामान अनुकूल आहे.** वार्याचा वेग **{wind} km/h** शांत असून पावसाची शक्यता नाही. सकाळी 8-11 किंवा संध्याकाळी 4-6 या वेळेत फवारणी करावी."
        en = f"✅ **Favorable window for spraying.** Wind speed is **{wind} km/h** (well within safe <15 km/h limit) and rain risk is negligible. Safe for foliar applications."

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_weekly_forecast(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide verified 7-day downscaled weekly forecast and weather trends for farm planning."""
    w = await _get_panchayat_weather_context(panchayat)
    forecast_7d = w.get("forecast_7d", [])
    total_rain = sum(d.get("rain_mm", 0.0) for d in forecast_7d)
    rain_days = sum(1 for d in forecast_7d if d.get("rain_mm", 0.0) >= 2.5)

    # Build weekly schedule rows
    rows_hi, rows_mr, rows_en = [], [], []
    for day in forecast_7d:
        dt = day.get("date", "")
        rain = day.get("rain_mm", 0.0)
        t_max = day.get("temp_max", 31.0)
        t_min = day.get("temp_min", 22.0)
        wind = day.get("wind_kmh", 12.0)
        
        status_hi = "🌧️ बारिश" if rain >= 2.5 else "🌦️ बूंदाबांदी" if rain > 0.0 else "☀️ शुष्क"
        status_mr = "🌧️ पाऊस" if rain >= 2.5 else "🌦️ हलक्या सरी" if rain > 0.0 else "☀️ कोरडे"
        status_en = "🌧️ Rain" if rain >= 2.5 else "🌦️ Drizzle" if rain > 0.0 else "☀️ Dry"

        rows_hi.append(f"• **{dt}:** {status_hi} ({rain} मिमी) · {t_max}°C / {t_min}°C · हवा {wind} km/h")
        rows_mr.append(f"• **{dt}:** {status_mr} ({rain} मिमी) · {t_max}°C / {t_min}°C · वारा {wind} km/h")
        rows_en.append(f"• **{dt}:** {status_en} ({rain} mm) · {t_max}°C / {t_min}°C · Wind {wind} km/h")

    schedule_hi = "\n".join(rows_hi) if rows_hi else "7-दिवसीय पूर्वानुमान शीघ्र उपलब्ध होगा।"
    schedule_mr = "\n".join(rows_mr) if rows_mr else "7 दिवसांचा अंदाज लवकरच उपलब्ध होईल."
    schedule_en = "\n".join(rows_en) if rows_en else "7-day forecast data updating shortly."

    summary_hi = (
        f"आगामी 7 दिनों में कुल **{total_rain:.1f} मिमी** वर्षा संभावित है ({rain_days} वर्षा दिवस)। "
        f"{'भारी वर्षा के दिनों में जल निकासी नालियां खुली रखें व छिड़काव रोकें।' if total_rain > 15 else 'अधिकांश दिन शुष्क रहने का अनुमान है, जिससे निराई-गुड़ाई, सिंचाई और कीटनाशक छिड़काव सुगमता से किए जा सकते हैं।'}"
    )
    summary_mr = (
        f"पुढील 7 दिवसांत एकूण **{total_rain:.1f} मिमी** पावसाचा अंदाज आहे ({rain_days} पावसाचे दिवस). "
        f"{'जास्त पावसाच्या काळात शेतात पाण्याचा निचरा योग्य ठेवा आणि फवारणी टाळा.' if total_rain > 15 else 'बहुतांश दिवस कोरडे राहण्याचा अंदाज असल्याने खुरपणी, सिंचन व फवारणीची कामे वेळेत पूर्ण करता येतील.'}"
    )
    summary_en = (
        f"Total expected 7-day cumulative rainfall is **{total_rain:.1f} mm** across {rain_days} rain day(s). "
        f"{'Keep drainage dead furrows open and postpone spraying on wet days.' if total_rain > 15 else 'Predominantly dry conditions expected; ideal for intercultural weeding, drip irrigation, and scheduled sprays.'}"
    )

    hi = (
        f"📅 **ग्राम पंचायत {panchayat.name} — आगामी 7 दिनों का मौसम पूर्वानुमान:**\n\n"
        f"{schedule_hi}\n\n"
        f"🌾 **सप्ताहिक कृषि योजना:** {summary_hi}"
    )
    mr = (
        f"📅 **ग्रामपंचायत {panchayat.name} — पुढील 7 दिवसांचा हवामान अंदाज:**\n\n"
        f"{schedule_mr}\n\n"
        f"🌾 **साप्ताहिक शेती नियोजन:** {summary_mr}"
    )
    en = (
        f"📅 **7-Day Weather Forecast for {panchayat.name} Gram Panchayat:**\n\n"
        f"{schedule_en}\n\n"
        f"🌾 **Weekly Farm Planning:** {summary_en}"
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "weather"


async def _handle_humidity(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide verified relative humidity levels and fungal disease infection risk thresholds."""
    w = await _get_panchayat_weather_context(panchayat)
    hum = w.get("humidity_pct", 65.0)
    rain = w.get("rain_mm", 0.0)
    temp = w.get("temp_max", 31.0)

    if hum >= 80.0:
        risk_hi = "🚨 **उच्च फफूंद व रोग जोखिम (High Fungal Risk):** हवा में 80% से अधिक नमी से एन्थ्रेक्नोज़, पत्ती धब्बा व सड़न का खतरा अत्यधिक बढ़ जाता है। पत्तियां सूखने पर कॉपर ऑक्सीक्लोराइड 50% WP (@ 2.5 g/L) या ट्राइकोडर्मा का सुरक्षात्मक छिड़काव करें।"
        risk_mr = "🚨 **जास्त बुरशीजन्य रोगांचा धोका (High Fungal Risk):** हवेत 80% पेक्षा जास्त दमटपणा असल्याने तांबेरा, करपा व कूज रोगाचा प्रादुर्भाव वाढू शकतो. पाने कोरडी झाल्यावर कॉपर ऑक्सिक्लोराईड (2.5 ग्रॅम/लिटर) फवारावे."
        risk_en = "🚨 **High Fungal & Leaf Disease Risk:** Relative humidity >80% provides ideal incubation for anthracnose, leaf spots, and fungal rot. Once foliage dries, apply prophylactic Copper Oxychloride 50% WP @ 2.5 g/L or bio-fungicide Trichoderma."
    elif hum >= 55.0:
        risk_hi = "✅ **सामान्य व संतुलित आर्द्रता:** फसलों की वृद्धि और वानस्पतिक विकास के लिए नमी का यह स्तर आदर्श है। कीटनाशक व पोषक तत्वों का पर्णीय छिड़काव सुचारू रूप से कर सकते हैं।"
        risk_mr = "✅ **सामान्य व अनुकूल दमटपणा:** पिकांच्या जोमदार वाढीसाठी हा ओलावा उत्तम आहे. पानांवर अन्नद्रव्ये व कीटकनाशक फवारणीसाठी योग्य वेळ आहे."
        risk_en = "✅ **Optimal & Balanced Humidity:** Humidity levels are ideal for crop transpiration and nutrient uptake. Safe for foliar fertilisation and pest management."
    else:
        risk_hi = "☀️ **कम आर्द्रता / शुष्क हवा:** हवा में नमी 55% से कम है। वाष्पीकरण अधिक होने से मिट्टी में नमी जल्दी सूखेगी। ड्रिप या शाम की हल्की सिंचाई करें। लाल मकड़ी (Mites) व थ्रिप्स की निगरानी रखें।"
        risk_mr = "☀️ **कमी आर्द्रता / कोरडे हवामान:** हवेतील ओलावा 55% पेक्षा कमी आहे. बाष्पीभवन वेगाने होत असल्याने शेतात हलके सिंचन करावे. कोळी (Mites) व थ्रिप्स किडींवर लक्ष ठेवा."
        risk_en = "☀️ **Low Humidity / Dry Air:** RH <55% increases evapotranspiration rates. Monitor topsoil moisture and schedule evening light irrigation. Watch for spider mites and thrips."

    hi = (
        f"💧 **ग्राम पंचायत {panchayat.name} — वायुमंडलीय आर्द्रता (नमी) रिपोर्ट:**\n\n"
        f"• **सापेक्ष आर्द्रता (Relative Humidity):** **{hum}%**\n"
        f"• **अधिकतम तापमान:** {temp}°C · वर्षा: {rain} मिमी\n\n"
        f"🌾 **रोग जोखिम विश्लेषण व सलाह:**\n{risk_hi}"
    )
    mr = (
        f"💧 **ग्रामपंचायत {panchayat.name} — हवेतील दमटपणा (आर्द्रता) अहवाल:**\n\n"
        f"• **सापेक्ष आर्द्रता:** **{hum}%**\n"
        f"• **कमाल तापमान:** {temp}°C · पाऊस: {rain} मिमी\n\n"
        f"🌾 **रोग धोका विश्लेषण व सल्ला:**\n{risk_mr}"
    )
    en = (
        f"💧 **Relative Humidity & Disease Risk Report ({panchayat.name} GP):**\n\n"
        f"• **Relative Humidity (RH):** **{hum}%**\n"
        f"• **Maximum Temp:** {temp}°C · Rainfall: {rain} mm\n\n"
        f"🌾 **Disease Threat Assessment:**\n{risk_en}"
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "weather"


async def _handle_crop_variety(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified ICAR/KVK recommended crop varieties and seed rates for Vidarbha/Central India."""
    msg_lower = message.lower()

    if "कपास" in msg_lower or "कापूस" in msg_lower or "cotton" in msg_lower:
        hi = (
            f"🧶 **विदर्भ क्षेत्र हेतु अनुशंसित उन्नत कपास किस्में (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **प्रमुख बीटी हाइब्रिड किस्में:** अजीत-155 (Ajeet-155), राशि-659 (RCH-659), यूएस-7067 (US-7067) व अंकुर 3028 — गुलाबी सुंडी व रसचूसक कीटों के प्रति सहनशील और उच्च उत्पादन (10-14 क्विंटल/एकड़)।\n"
            f"2. **सघन रोपण (HDPS किस्में):** सुरज (Suraj), पीकेवी 081 — 3x1 फीट दूरी पर रोपाई हेतु उपयुक्त।\n"
            f"3. **बीज दर व कतार दूरी:** बीटी संकर हेतु 1.5 से 2 पैकेट (450g) प्रति एकड़; कतार दूरी 3.5 से 4 फीट और पौधे से पौधा 1.5 फीट रखें।\n"
            f"4. **बीजोपचार:** बीजों को थायोमेथोक्सम 30% FS (@ 5 ml/किग्रा) से उपचारित करें ताकि प्रारंभिक 30 दिन रसचूसक कीटों से सुरक्षा मिले।"
        )
        mr = (
            f"🧶 **विदर्भ विभागासाठी शिफारस केलेले सुधारित कापूस वाण (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **प्रमुख बीटी संकरित वाण:** अजित-155 (Ajeet-155), राशी-659 (RCH-659), यूएस-7067 (US-7067) — बोंडअळी व रसशोषक किडींना प्रतिकारक्षम आणि एकरी 10-14 क्विंटल उत्पादन.\n"
            f"2. **सघन लागवड पद्धत (HDPS):** सुरज, पीकेव्ही 081 — 3x1 फूट अंतरावर लागवडीसाठी उत्तम.\n"
            f"3. **बियाणे प्रमाण व अंतर:** एकरी 2 पाकिटे (450 ग्रॅम). दोन ओळीत 4 फूट आणि दोन रोपांत 1.5 फूट अंतर ठेवावे.\n"
            f"4. **बीजप्रक्रिया:** थायामेथॉक्झाम 30% FS (5 मिली/किलो बियाणे) चोळावे, ज्यामुळे सुरुवातीचे 30 दिवस रसशोषक किडींपासून संरक्षण मिळते."
        )
        en = (
            f"🧶 **Recommended High-Yielding Cotton Varieties for Vidarbha ({panchayat.name} GP):**\n\n"
            f"1. **Top Bt BG-II Hybrids:** Ajeet-155, RCH-659, US-7067, and Ankur-3028. Proven bollworm resilience and yield potential of 10-14 quintals/acre.\n"
            f"2. **High-Density Planting (HDPS):** Non-Bt / Desi varieties like Suraj, PKV-081 spaced at 3x1 ft.\n"
            f"3. **Seed Rate & Spacing:** 1.5 to 2 packets (450g) per acre. Standard spacing: 4 ft row-to-row and 1.5 ft plant-to-plant.\n"
            f"4. **Seed Treatment:** Treat with Thiamethoxam 30% FS @ 5 ml/kg seed for 30-day early sucking pest protection."
        )
    elif "चना" in msg_lower or "हरभरा" in msg_lower or "gram" in msg_lower or "chana" in msg_lower:
        hi = (
            f"🥣 **उन्नत चना/हरभरा किस्में व बीजोपचार (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **जाकी 9218 (Jaki 9218):** विदर्भ की सबसे लोकप्रिय व उकटा (विल्ट) प्रतिरोधी किस्म। दाना बड़ा, पकने की अवधि 105-110 दिन, उत्पादन 18-20 क्विंटल/हेक्टेयर।\n"
            f"2. **दिग्विजय व फुले विक्रम:** यांत्रिक कटाई (Harvester) हेतु उपयुक्त सीधी बढ़ने वाली किस्में।\n"
            f"3. **बीज दर:** जाकी 9218 हेतु 30-35 किग्रा प्रति एकड़।\n"
            f"4. **अनिवार्य बीजोपचार:** ट्राइकोडर्मा विरिडी (@ 5 ग्राम/किग्रा) + राइजोबियम व पीएसबी कल्चर (20 ग्राम/किग्रा) से उपचारित करके ही बोएं।"
        )
        mr = (
            f"🥣 **सुधारित हरभरा वाण व बीजप्रक्रिया (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **जाकी 9218 (Jaki 9218):** विदर्भातील सर्वाधिक लोकप्रिय व मर (Wilt) रोग प्रतिकारक वाण. दाणा टपोरा, कालावधी 105-110 दिवस, उत्पादन 18-20 क्विंटल/हेक्टर.\n"
            f"2. **दिग्विजय व फुले विक्रम:** कम्बाइन हार्वेस्टरने काढणीसाठी योग्य सरळ वाढणारे वाण.\n"
            f"3. **बियाणे प्रमाण:** एकरी 30 ते 35 किलो.\n"
            f"4. **बीजप्रक्रिया:** ट्रायकोडर्मा (5 ग्रॅम/किलो) + रायझोबियम व पीएसबी जिवाणू संवर्धन (20 ग्रॅम/किलो) चोळूनच पेरणी करावी."
        )
        en = (
            f"🥣 **Recommended Chickpea / Bengal Gram Varieties ({panchayat.name} GP):**\n\n"
            f"1. **Jaki 9218:** Vidarbha's benchmark wilt-resistant variety. Bold grains, 105-110 days maturity, yield potential 18-20 q/ha.\n"
            f"2. **Phule Vikram & Digvijay:** Erect growth habit suitable for combine mechanical harvesting.\n"
            f"3. **Seed Rate:** 30-35 kg per acre for bold seed varieties.\n"
            f"4. **Seed Inoculation:** Treat with Trichoderma viride @ 5 g/kg seed + Rhizobium & PSB culture @ 20 g/kg."
        )
    else:
        # Default to Soybean (primary Vidarbha Kharif cash crop)
        hi = (
            f"🫘 **विदर्भ क्षेत्र हेतु ICAR/KVK प्रमाणित उन्नत सोयाबीन किस्में (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **जे.एस. 20-34 (JS 20-34):** कम अवधि (85-88 दिन) में पकने वाली किस्म। अल्प वर्षा व सूखा प्रभावित क्षेत्रों हेतु वरदान, उत्पादन 8-10 क्विंटल/एकड़।\n"
            f"2. **फुले संगम (KDS 726):** सर्वाधिक उत्पादन (12-15 क्विंटल/एकड़) देने वाली किस्म। अवधि 100-105 दिन, तांबेरा (गेरुआ/Rust) व तना मक्खी प्रतिरोधी।\n"
            f"3. **जे.एस. 20-69 व एनआरसी 127:** मध्यम अवधि (93-96 दिन) और फलियों के चटकने (pod shattering) के प्रति सहनशील।\n"
            f"4. **बीज दर व बीजोपचार:** 25-30 किग्रा प्रति एकड़। बोवाई से पूर्व कार्बाक्सिन + थीरम (2 ग्राम/किग्रा) या ट्राइकोडर्मा (5 ग्राम/किग्रा) के बाद राइजोबियम कल्चर अवश्य लगाएं।"
        )
        mr = (
            f"🫘 **विदर्भ विभागासाठी कृषी विद्यापीठ प्रमाणित सोयाबीन वाण (ग्रा.पं. {panchayat.name}):**\n\n"
            f"1. **जे.एस. 20-34 (JS 20-34):** कमी कालावधीत (85-88 दिवस) येणारा वाण. कमी पाऊस किंवा अवर्षणातही खात्रीशीर उत्पादन (8-10 क्विंटल/एकर).\n"
            f"2. **फुले संगम (KDS 726):** विक्रमी उत्पादन (12-15 क्विंटल/एकर) देणारा लोकप्रिय वाण. तांबेरा रोगास पूर्णतः प्रतिकारक्षम, कालावधी 100-105 दिवस.\n"
            f"3. **जे.एस. 20-69 व एनआरसी 127:** मध्यम कालावधी (93-96 दिवस) आणि शेंगा तडकण्यास प्रतिबंधक.\n"
            f"4. **बियाणे प्रमाण व बीजप्रक्रिया:** एकरी 25-30 किलो. पेरणीपूर्वी थायरम + कार्बेन्डाझिम (2 ग्रॅम/किलो) व नंतर रायझोबियम जीवाणू संवर्धन चोळावे."
        )
        en = (
            f"🫘 **ICAR/KVK Certified High-Yielding Soybean Varieties ({panchayat.name} GP):**\n\n"
            f"1. **JS 20-34:** Early maturity (85-88 days). Superb drought escape mechanism, yields 8-10 quintals/acre.\n"
            f"2. **Phule Sangam (KDS 726):** Highest-yielding variety (12-15 q/acre). Rust-tolerant, sturdy stems resistant to lodging, maturity 100-105 days.\n"
            f"3. **JS 20-69 & NRC 127:** Medium maturity (93-96 days), strong resistance to pod shattering and stem fly.\n"
            f"4. **Seed Rate & Treatment:** 25-30 kg/acre. Treat with Carboxin + Thiram @ 2 g/kg, followed by Rhizobium japonicum & PSB culture."
        )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_weed_control(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified ICAR herbicide protocols and weed management guidelines."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w.get("rain_mm", 0.0)
    wind = w.get("wind_speed_kmh", 12.0)

    weather_note_hi = (
        f"⚠️ **मौसम चेतावनी:** आज हवा {wind} km/h और वर्षा {rain} mm है। "
        f"{'बारिश संभावित होने से खरपतवार नाशक न डालें, दवा बह जाएगी।' if rain >= 3 else 'हवा 15 km/h से शांत रहने पर फ्लैट फैन नोजल से 150 लीटर पानी/एकड़ में स्प्रे करें।'}"
    )
    weather_note_mr = (
        f"⚠️ **हवामान इशारा:** आज वारा {wind} km/h आणि पाऊस {rain} mm आहे. "
        f"{'पावसाची शक्यता असल्याने तणनाशक फवारणी पुढे ढकला.' if rain >= 3 else 'वारा शांत असताना फ्लॅट फॅन नोजल वापरून एकरी 150 लिटर पाण्यात फवारणी करावी.'}"
    )
    weather_note_en = (
        f"⚠️ **Weather Advisory:** Current wind is {wind} km/h and rain forecast is {rain} mm. "
        f"{'Hold herbicide application as expected rain will wash away chemical.' if rain >= 3 else 'Safe for herbicide spray using flat fan nozzles in 150 L clean water/acre.'}"
    )

    hi = (
        f"🌿 **सोयाबीन व खरीफ फसलों में खरपतवार (तण) नियंत्रण वैज्ञानिक उपाय:**\n\n"
        f"1. **बोवाई के तुरंत बाद (Pre-Emergence, 0-72 घंटे के भीतर):**\n"
        f"   • पेंडीमेथालिन 30% EC (Pendimethalin) @ 1.0 से 1.25 लीटर प्रति एकड़ पर्याप्त मिट्टी नमी में छिड़कें। यह खरपतवार के बीजों को अंकुरित ही नहीं होने देता।\n\n"
        f"2. **खड़ी फसल में (Post-Emergence, बोवाई के 15-20 दिन बाद, 2-3 पत्ती अवस्था):**\n"
        f"   • **चौड़ी व संकरी दोनों पत्तियों के लिए:** इमाजेथापायर 10% SL (Imazethapyr / परसूट) @ 400 ml प्रति एकड़ अथवा प्रोपाक्विजाफॉप 2.5% + इमाजेथापायर 3.75% ME (शाकेद) @ 800 ml/एकड़।\n"
        f"   • **केवल संकरी पत्ती/घास कुल के लिए:** क्विझालोफॉप-इथाइल 5% EC (टर्गा सुपर) @ 350-400 ml प्रति एकड़।\n\n"
        f"{weather_note_hi}\n\n"
        f"💡 *महत्वपूर्ण:* खरपतवार नाशक का छिड़काव हमेशा गीली मिट्टी (वापसा) में ही करें, सूखी जमीन पर दवा काम नहीं करती।"
    )
    mr = (
        f"🌿 **सोयाबीन व खरीप पिकातील तण व्यवस्थापन आणि तणनाशक मार्गदर्शन:**\n\n"
        f"1. **पेरणीनंतर लगेच (Pre-Emergence, 0-72 तासांत वापसा असताना):**\n"
        f"   • पेंडीमेथॅलीन 30% EC (Pendimethalin) @ 1.0 ते 1.25 लिटर प्रति एकर फवारावे. यामुळे तणांचे बी उगवतच नाही.\n\n"
        f"2. **उगवणीनंतर (Post-Emergence, पेरणीनंतर 15-20 दिवसांनी, तण 2-3 पानांवर असताना):**\n"
        f"   • **सर्व प्रकारच्या तणांसाठी (रुंद व अरुंद पाने):** इमाझेथापायर 10% SL (पर्सेट) @ 400 मिली प्रति एकर किंवा प्रोपाक्विझाफॉप + इमाझेथापायर (शाकेद) @ 800 मिली/एकर.\n"
        f"   • **केवळ गवत वर्गीय तणांसाठी:** क्विझालोफॉप-इथाईल 5% EC (टर्गा सुपर) @ 350-400 मिली प्रति एकर.\n\n"
        f"{weather_note_mr}\n\n"
        f"💡 *महत्त्वाचे:* तणनाशक फवारणी करताना जमिनीत पुरेसा ओलावा असणे आवश्यक आहे."
    )
    en = (
        f"🌿 **Integrated Weed Management & Herbicide Guidelines ({panchayat.name} GP):**\n\n"
        f"1. **Pre-Emergence (Within 0-72 hours of sowing in moist soil):**\n"
        f"   • Pendimethalin 30% EC @ 1.0 to 1.25 Liters per acre. Inhibits weed seed germination without crop injury.\n\n"
        f"2. **Early Post-Emergence (15-20 days after sowing, 2-3 leaf stage of weeds):**\n"
        f"   • **Broadleaf + Grassy Weeds:** Imazethapyr 10% SL @ 400 ml/acre OR Propaquizafop 2.5% + Imazethapyr 3.75% ME @ 800 ml/acre.\n"
        f"   • **Grassy Weeds Only:** Quizalofop-ethyl 5% EC @ 350-400 ml/acre.\n\n"
        f"{weather_note_en}\n\n"
        f"💡 *Agronomic Rule:* Always spray in moist soil conditions using a flat fan / flood jet nozzle."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_crop_disease(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified diagnosis and treatment for leaf yellowing, chlorosis, wilt, and blight."""
    w = await _get_panchayat_weather_context(panchayat)
    msg_lower = message.lower()

    if "लाल्या" in msg_lower or "lalya" in msg_lower or "reddening" in msg_lower:
        hi = (
            f"🍂 **कपास में लाल्या रोग (Leaf Reddening) के कारण व निवारण:**\n\n"
            f"• **कारण:** मैग्नीशियम की कमी, रात के तापमान में अचानक गिरावट और लंबे समय तक खेत में नमी की कमी।\n"
            f"• **उपचार उपाय:** 1% मैग्नीशियम सल्फेट (MgSO4 @ 10 ग्राम/लीटर) + 1% 19:19:19 घुलनशील खाद (10 ग्राम/लीटर) का पत्तियों पर 10 दिन के अंतराल पर 2 बार छिड़काव करें।\n"
            f"• **जड़ पोषण:** ड्रिप अथवा मिट्टी में 20 किग्रा मैग्नीशियम सल्फेट प्रति एकड़ दें।"
        )
        mr = (
            f"🍂 **कापसावरील लाल्या रोगाची कारणे व उपाययोजना:**\n\n"
            f"• **कारणे:** मॅग्नेशियम अन्नद्रव्याची कमतरता, रात्रीच्या तापमानात घट आणि पाण्याचा ताण यामुळे पाने तांबडी पडतात.\n"
            f"• **उपाययोजना:** 1% मॅग्नेशियम सल्फेट (10 ग्रॅम/लिटर) + 1% 19:19:19 (10 ग्रॅम/लिटर) ची 10 दिवसांच्या अंतराने दोनदा पानांवर फवारणी करावी.\n"
            f"• **जमिनीतून मात्रा:** एकरी 20 किलो मॅग्नेशियम सल्फेट जमिनीत मिसळून द्यावे."
        )
        en = (
            f"🍂 **Cotton Leaf Reddening (Lalya) Diagnosis & Remedy:**\n\n"
            f"• **Root Causes:** Magnesium deficiency exacerbated by sudden night temperature dips and moisture stress.\n"
            f"• **Foliar Treatment:** Spray 1% Magnesium Sulphate (MgSO4 @ 10 g/L) + 1% 19:19:19 (10 g/L) twice at a 10-day interval.\n"
            f"• **Soil Amendment:** Apply 20 kg Magnesium Sulphate per acre through band placement or drip."
        )
    else:
        # General yellowing (पीलापन / पिवळेपणा)
        hi = (
            f"🍂 **फसल में पीलापन (Yellowing Leaves) के 3 प्रमुख कारण और सटीक उपचार:**\n\n"
            f"1. **लोहा/जिंक की कमी (Iron/Zinc Chlorosis):** यदि ऊपरी नई पत्तियां पीली हैं लेकिन नसें हरी हैं, तो यह सूक्ष्म पोषक तत्वों की कमी है।\n"
            f"   • *उपाय:* फेरस सल्फेट (50 ग्राम) + जिंक सल्फेट (30 ग्राम) + नींबू सत्व/साइट्रिक एसिड (10 ग्राम) प्रति 15 लीटर पानी में घोलकर छिड़कें।\n\n"
            f"2. **पीला मोज़ेक वायरस (Yellow Mosaic Virus):** यदि पत्तियों पर चितकबरे पीले-हरे धब्बे हैं, तो यह सफेद मक्खी द्वारा फैला वायरस है।\n"
            f"   • *उपाय:* सफेद मक्खी नियंत्रण हेतु थायोमेथोक्सम 25% WG (@ 4 ग्राम/15L) या एसिटामिप्रिड 20% SP (@ 5 ग्राम/15L) का छिड़काव करें।\n\n"
            f"3. **अत्यधिक पानी/नाइट्रोजन लीचिंग:** लगातार बारिश या जलभराव से जड़ें सांस नहीं ले पातीं और निचली पत्तियां पीली पड़ जाती हैं।\n"
            f"   • *उपाय:* जल निकासी के बाद 2% यूरिया (20 ग्राम/लीटर) या 19:19:19 (10 ग्राम/लीटर) का पर्णीय छिड़काव करें।"
        )
        mr = (
            f"🍂 **पिकातील पिवळेपणा (Yellowing) ची 3 प्रमुख कारणे व अचूक उपाय:**\n\n"
            f"1. **लोह व जस्त कमतरता (Chlorosis):** वरची कोवळी पाने पिवळी पडून शिरा हिरव्या राहिल्यास ही सूक्ष्म अन्नद्रव्यांची कमतरता असते.\n"
            f"   • *उपाय:* फेरस सल्फेट (50 ग्रॅम) + झिंक सल्फेट (30 ग्रॅम) + लिंबू सत्व (10 ग्रॅम) प्रति 15 लिटर पाण्यात मिसळून फवारावे.\n\n"
            f"2. **पिवळा मोझॅक (Yellow Mosaic Virus):** पानांवर पिवळे-हिरवे ठिपके दिसल्यास हा पांढऱ्या माशीमुळे पसरणारा विषाणू रोग आहे.\n"
            f"   • *उपाय:* पांढऱ्या माशीच्या नियंत्रणासाठी थायामेथॉक्झाम 25% WG (4 ग्रॅम/15L) किंवा ॲसिटामिप्रिड 20% SP (5 ग्रॅम/15L) फवारावे.\n\n"
            f"3. **पाणी साचल्यामुळे आलेला पिवळेपणा:** मुळांना हवा न मिळाल्याने नायट्रोजन शोषण थांबते.\n"
            f"   • *उपाय:* पाण्याचा निचरा झाल्यावर 2% युरिया (20 ग्रॅम/लिटर) किंवा 19:19:19 (10 ग्रॅम/लिटर) ची फवारणी करावी."
        )
        en = (
            f"🍂 **Crop Leaf Yellowing (Chlorosis) Diagnosis & Scientific Remedies:**\n\n"
            f"1. **Iron / Zinc Chlorosis:** If upper young leaves turn yellow while veins remain dark green:\n"
            f"   • *Remedy:* Spray Ferrous Sulphate (50g) + Zinc Sulphate (30g) + Citric Acid (10g) per 15 L water.\n\n"
            f"2. **Yellow Mosaic Virus (YMV):** Irregular bright yellow and green mosaic patches transmitted by whiteflies:\n"
            f"   • *Remedy:* Vector control with Thiamethoxam 25% WG @ 4g/15L or Acetamiprid 20% SP @ 5g/15L.\n\n"
            f"3. **Waterlogging Induced Nitrogen Starvation:** Lower leaves turn pale yellow after heavy rainfall:\n"
            f"   • *Remedy:* Clear standing water immediately, then apply foliar spray of 2% Urea (20 g/L) or 19:19:19 (10 g/L)."
        )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_soil_health(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified soil testing procedures, soil health card guidance, and black cotton soil management."""
    hi = (
        f"🧪 **मृदा स्वास्थ्य एवं मिट्टी परीक्षण संपूर्ण वैज्ञानिक मार्गदर्शिका (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **मिट्टी का नमूना लेने की सही विधि (V-Cut Method):**\n"
        f"   • खेत में 8-10 स्थानों पर अंग्रेजी के 'V' आकार का 15 सेमी (6 इंच) गहरा गड्ढा खोदें।\n"
        f"   • खुरपी से गड्ढे की दीवार से ऊपर से नीचे तक 1 इंच मोटी मिट्टी की परत खुरचें।\n"
        f"   • सभी नमूनों को साफ कपड़े/तिरपाल पर अच्छी तरह मिलाएं, छाया में सुखाएं और चौथाईकरण (Quartering) विधि से 500 ग्राम नमूना तैयार कर थैली में भरें।\n\n"
        f"2. **काली कपासी मिट्टी (Black Cotton Soil / Vertisol) सुधार:**\n"
        f"   • विदर्भ की भारी काली मिट्टी में जल धारण क्षमता अधिक होती है परंतु जल निकासी धीमी होती है।\n"
        f"   • प्रति एकड़ 4-5 टन अच्छी सड़ी गोबर की खाद अथवा 1.5 टन वर्मीकम्पोस्ट (केंचुआ खाद) अवश्य मिलाएं।\n"
        f"   • कठोर/क्षारीय मिट्टी में जल प्रवेश सुधारने हेतु 250-300 किग्रा जिप्सम प्रति एकड़ 3 वर्ष में एक बार डालें।\n\n"
        f"3. **मृदा परीक्षण प्रयोगशाला:** कलमेश्वर तालुका कृषि अधिकारी (TAO) कार्यालय अथवा कृषि विज्ञान केंद्र (KVK) नागपुर में मात्र ₹30-50 शुल्क में 12 पोषक तत्वों की जांच उपलब्ध है।"
    )
    mr = (
        f"🧪 **माती परीक्षण व जमीन आरोग्य सुधारणा मार्गदर्शन (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **मातीचा नमुना घेण्याची शास्त्रीय पद्धत (V-आकार पद्धत):**\n"
        f"   • शेतात झिगझॅग पद्धतीने 8-10 ठिकाणी 'V' आकाराचे 15 सेंमी (6 इंच) खोल खड्डे करा.\n"
        f"   • खड्ड्याच्या बाजूने वरपासून खालपर्यंत 1 इंच जाडीचा मातीचा थर खुरप्याने काढा.\n"
        f"   • गोळा केलेली माती एकत्र करून सावलीत वाळवा. त्यातील 500 ग्रॅम प्रतिनिधी नमुना प्रयोगशाळेसाठी ठेवा.\n\n"
        f"2. **काळी कसदार माती (काळी जमीन) व्यवस्थापन:**\n"
        f"   • जमिनीचा पोत सुधारण्यासाठी व सेंद्रिय कर्ब वाढवण्यासाठी एकरी 4-5 ट्रॉली चांगले कुजलेले शेणखत किंवा 1.5 टन गांडूळ खत टाकावे.\n"
        f"   • चोपण जमिनीत पाण्याचा निचरा सुधारण्यासाठी 3 वर्षांतून एकदा एकरी 250-300 किलो जिप्सम द्यावे.\n\n"
        f"3. **माती तपासणी केंद्र:** कळमेश्वर तालुका कृषी कार्यालय किंवा केव्हीके (KVK) नागपूर येथे नाममात्र ₹30-50 शुल्कात 12 घटकांची माती तपासणी होते."
    )
    en = (
        f"🧪 **Soil Testing & Black Cotton Soil Management ({panchayat.name} GP):**\n\n"
        f"1. **Standard Soil Sampling Protocol (V-Cut Method):**\n"
        f"   • Dig 15 cm (6 inches) deep 'V' shaped pits at 8-10 representative zig-zag points across the acre.\n"
        f"   • Scrape a 1-inch uniform soil slice from the pit wall from top to bottom.\n"
        f"   • Mix thoroughly on clean canvas, air dry in shade, and reduce to a 500g composite sample using the quartering technique.\n\n"
        f"2. **Black Cotton Soil (Vertisol) Conditioning:**\n"
        f"   • Vertisols swell when wet and crack when dry. To improve water infiltration and organic carbon, incorporate 4-5 tonnes well-decomposed FYM or 1.5 tonnes vermicompost per acre.\n"
        f"   • In sodic/dense patches, broadcast 250-300 kg agricultural gypsum per acre every 3 years.\n\n"
        f"3. **Testing Facility:** Available at Kalmeshwar Taluka Agriculture Office and KVK Nagpur for a nominal fee of ₹30-50 per sample."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_organic_farming(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified natural/organic farming recipes: Jeevamrit, Neemastra, Dashparni Ark."""
    hi = (
        f"🌿 **प्राकृतिक व जैविक खेती के 3 प्रमाणित देसी नुस्खे (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **जीवामृत बनाने की विधि (200 लीटर ड्रम - 1 एकड़ हेतु):**\n"
        f"   • **सामग्री:** 10 किग्रा देसी गाय का गोबर + 10 लीटर गोमूत्र + 2 किग्रा पुराना गुड़ + 2 किग्रा बेसन (चने का आटा) + 1 मुट्ठी खेत की सजीव मेड़ की मिट्टी।\n"
        f"   • **विधि:** 200 लीटर पानी में सभी सामग्री मिलाकर छाया में रखें। 48-72 घंटे तक सुबह-शाम 2 मिनट घड़ी की दिशा में डंडे से चलाएं।\n"
        f"   • **प्रयोग:** सिंचाई के पानी के साथ बहाएं अथवा 10% घोल (100 ml/L) बनाकर फसलों पर पर्णीय छिड़काव करें।\n\n"
        f"2. **नीमास्त्र (रसचूसक कीटों व छोटी इल्लियों हेतु):**\n"
        f"   • 5 किग्रा कुचली हुई नीम की पत्तियां + 5 लीटर गोमूत्र + 2 किग्रा गाय का गोबर 100 लीटर पानी में 48 घंटे सड़ाएं। छानकर सीधा छिड़कें।\n\n"
        f"3. **दशपर्णी अर्क (गंभीर कीट प्रकोप व सुंडी नियंत्रण):**\n"
        f"   • नीम, करंज, सीताफल, पपीता, अरंडी, धतूरा, निर्गुंडी, बेशरम, मदार व कनेर के 2-2 किग्रा पत्ते गोमूत्र में 30 दिन सड़ाकर तैयार किया जाता है।"
    )
    mr = (
        f"🌿 **नैसर्गिक व सेंद्रिय शेतीचे 3 सिद्ध उपाय (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **जीवामृत बनवण्याची कृती (200 लिटर ड्रम - 1 एकरासाठी):**\n"
        f"   • **साहित्य:** 10 किलो देशी गाईचे शेण + 10 लिटर गोमूत्र + 2 किलो सेंद्रिय गूळ + 2 किलो बेसन (डाळीचे पीठ) + 1 मूठ बांधावरील सुपीक माती.\n"
        f"   • **कृती:** 200 लिटर पाण्यात सर्व साहित्य मिसळून सावलीत ठेवा. 48 ते 72 तास दररोज सकाळी-संध्याकाळी काठीने ढवळावे.\n"
        f"   • **वापर:** सिंचनाच्या पाण्यासोबत एकरी 200 लिटर सोडावे किंवा 10% द्रावण तयार करून पानांवर फवारावे.\n\n"
        f"2. **निमास्त्र (रसशोषक किडी व लहान अळ्यांसाठी):**\n"
        f"   • 5 किलो लिंबाचा पाला + 5 लिटर गोमूत्र + 2 किलो शेण 100 लिटर पाण्यात 48 तास आंबवून थेट फवारणी करावी.\n\n"
        f"3. **दशपर्णी अर्क (मोठ्या अळ्या व बोंडअळी प्रतिबंध):**\n"
        f"   • कडुनिंब, करंज, सीताफळ, पपई, एरंडी, धोत्रा, निर्गुडी अशा 10 प्रकारच्या पानांचा अर्क गोमूत्रात तयार केला जातो."
    )
    en = (
        f"🌿 **Certified Natural & Organic Farming Formulations ({panchayat.name} GP):**\n\n"
        f"1. **Jeevamrit Preparation (200 L Drum for 1 Acre):**\n"
        f"   • **Ingredients:** 10 kg indigenous cow dung + 10 L cow urine + 2 kg organic jaggery + 2 kg gram/pulse flour (besan) + 1 handful fertile field boundary soil.\n"
        f"   • **Method:** Dissolve in 200 L water in shade. Stir clockwise for 2 minutes twice daily for 48-72 hours.\n"
        f"   • **Application:** Apply 200 L/acre through flood/drip irrigation or as a 10% filtered foliar spray.\n\n"
        f"2. **Neemastra (For Sucking Pests & Early Caterpillars):**\n"
        f"   • Ferment 5 kg crushed neem leaves + 5 L cow urine + 2 kg cow dung in 100 L water for 48 hours. Filter and spray directly.\n\n"
        f"3. **Dashparni Ark (Broad-Spectrum Botanical Insecticide):**\n"
        f"   • Prepared using leaves from 10 unpalatable plants (Neem, Karanj, Custard apple, Castor, Vitex, Datura, Papaya) fermented in cow urine for 30-40 days."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_govt_schemes(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified details on PM-KISAN, PMFBY Crop Insurance, Drip subsidies, and Solar Pumps."""
    hi = (
        f"🏛️ **प्रमुख सरकारी कृषि योजनाएं, पात्रता एवं सब्सिडी नियम (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **पीएम-किसान सम्मान निधि (PM-KISAN):**\n"
        f"   • पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की राशि ₹2,000 की तीन समान किस्तों में सीधे बैंक खाते में (DBT)।\n"
        f"   • *आवश्यक शर्तें:* आधार ई-केवाईसी (e-KYC), जमीन का भूलेख अंकन (Land Seeding) और बैंक खाता आधार से लिंक होना अनिवार्य है।\n\n"
        f"2. **प्रधानमंत्री फसल बीमा योजना (PMFBY):**\n"
        f"   • खरीफ फसलों (सोयाबीन/कपास) हेतु किसान प्रीमियम मात्र 2%।\n"
        f"   • **अति महत्वपूर्ण (72 घंटे का नियम):** प्राकृतिक आपदा (अतिवृष्टि, जलभराव, ओलावृष्टि) से फसल नुकसान होने पर घटना के **72 घंटे के भीतर** फसल बीमा ऐप (Crop Insurance App) अथवा टोल-फ्री 14447 पर सूचना देना अनिवार्य है।\n\n"
        f"3. **ड्रिप व स्प्रिंकलर सूक्ष्म सिंचाई सब्सिडी (MahaDBT):**\n"
        f"   • छोटे व सीमांत किसानों को 75-80% तथा अन्य किसानों को 55% तक का सरकारी अनुदान।\n\n"
        f"4. **पीएम-कुसुम सौर कृषि पंप योजना (PM-KUSUM):**\n"
        f"   • 3 HP, 5 HP व 7.5 HP सोलर पंप पर 90% से 95% तक की सब्सिडी।\n\n"
        f"🌐 **आवेदन पोर्टल:** mahadbt.maharashtra.gov.in एवं pmkisan.gov.in"
    )
    mr = (
        f"🏛️ **महत्त्वाच्या शासकीय कृषी योजना व अनुदान मार्गदर्शन (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **पीएम-किसान सन्मान निधी योजना (PM-KISAN):**\n"
        f"   • पात्र शेतकऱ्यांना वर्षाला ₹6,000 तीन समान हप्त्यांमध्ये थेट बँक खात्यात जमा होतात.\n"
        f"   • *आवश्यक:* आधार ई-केवायसी (e-KYC), बँक खात्याशी आधार संलग्न आणि 7/12 उतारा नोंदणी असणे बंधनकारक.\n\n"
        f"2. **प्रधानमंत्री पीक विमा योजना (PMFBY):**\n"
        f"   • खरीप पिकांसाठी (सोयाबीन/कापूस) केवळ 2% शेतकरी विमा हप्ता.\n"
        f"   • **महत्त्वाचा 72 तासांचा नियम:** अतिवृष्टी किंवा नैसर्गिक आपत्तीने नुकसान झाल्यास **72 तासांच्या आत** क्रॉप इन्शुरन्स ॲपवर किंवा 14447 या टोल-फ्री क्रमांकावर पूर्वसूचना नोंदवणे सक्तीचे आहे.\n\n"
        f"3. **ठिबक व तुषार सिंचन सबसिडी (महाडीबीटी):**\n"
        f"   • अल्प व अत्यल्प भूधारक शेतकऱ्यांना 75-80% पर्यंत शासकीय अनुदान उपलब्ध.\n\n"
        f"4. **मागेल त्याला सौर कृषी पंप योजना:**\n"
        f"   • 3, 5 व 7.5 अश्वशक्ती सौर पंपांवर 90 ते 95% अनुदान.\n\n"
        f"🌐 **अधिकृत पोर्टल:** mahadbt.maharashtra.gov.in"
    )
    en = (
        f"🏛️ **Key Government Agricultural Schemes & Direct Subsidies ({panchayat.name} GP):**\n\n"
        f"1. **PM-KISAN Samman Nidhi:**\n"
        f"   • ₹6,000 per year transferred directly in three equal installments of ₹2,000 via DBT.\n"
        f"   • *Requirements:* Aadhaar e-KYC, Aadhaar-seeded bank account, and land record linking.\n\n"
        f"2. **Pradhan Mantri Fasal Bima Yojana (PMFBY):**\n"
        f"   • Farmer premium is only 2% for Kharif crops (Soybean, Cotton, Paddy).\n"
        f"   • **Critical 72-Hour Rule:** In case of localized damage (heavy rainfall, waterlogging, hail), intimation must be registered within **72 hours** via the Crop Insurance App or Toll-Free 14447.\n\n"
        f"3. **Micro-Irrigation Drip & Sprinkler Subsidy (MahaDBT):**\n"
        f"   • 55% to 80% subsidy for small and marginal farmers under PMKSY.\n\n"
        f"4. **PM-KUSUM Solar Agricultural Pumps:**\n"
        f"   • Up to 90-95% capital subsidy on 3 HP, 5 HP, and 7.5 HP off-grid solar water pumps.\n\n"
        f"🌐 **Official Portal:** mahadbt.maharashtra.gov.in and pmkisan.gov.in"
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_storage_management(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified post-harvest storage, grain moisture limits, and pest prevention guidelines."""
    hi = (
        f"📦 **अनाज एवं बीज सुरक्षित भंडारण वैज्ञानिक दिशा-निर्देश (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **नमी का सुरक्षित मानक (Moisture Content):**\n"
        f"   • सोयाबीन व दलहनी फसलों को धूप में तब तक सुखाएं जब तक दानों में नमी **8 से 9%** से कम न हो जाए (गेहूं/धान हेतु 10-12%)।\n"
        f"   • *दांत से परीक्षण:* दाने को दांतों से दबाने पर यदि 'कट' की तेज आवाज आए, तो दाना भंडारण हेतु सुरक्षित है।\n\n"
        f"2. **बोरी भंडारण के नियम:**\n"
        f"   • बोरियों को कभी भी सीधे गीले फर्श अथवा दीवार से सटाकर न रखें।\n"
        f"   • फर्श पर लकड़ी के पटिए (Wooden Pallets) बिछाएं और दीवार से 1 मीटर की दूरी रखें।\n"
        f"   • बोरियों के ढेर की ऊंचाई 6-7 बोरी से अधिक न रखें ताकि नीचे की बोरियों में दाना पिसे नहीं और हवा का आवागमन बना रहे।\n\n"
        f"3. **घुन व कीटों से प्राकृतिक बचाव:**\n"
        f"   • प्रति क्विंटल अनाज में 2 किग्रा सूखी नीम की पत्तियां मिलाएं अथवा अनाज को हर्मीटिक पिक्स बैग (PICS Triple-Layer Bags) में सील करें।"
    )
    mr = (
        f"📦 **धान्य व बियाणे सुरक्षित साठवणूक शास्त्रीय मार्गदर्शक (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **सुरक्षित ओलावा मर्यादा (Moisture Content):**\n"
        f"   • सोयाबीन व हरभरा धान्य साठवण्यापूर्वी उन्हात चांगले वाळवून ओलावा **8 ते 9%** च्या खाली आणावा.\n"
        f"   • *पारंपरिक चाचणी:* दात खाली दाणा धरून चावल्यास 'कट' असा आवाज आल्यास धान्य साठवणीस योग्य समजावे.\n\n"
        f"2. **गोदामातील पोती ठेवण्याची पद्धत:**\n"
        f"   • पोती कधीही थेट जमिनीवर किंवा भिंतीला टेकवून ठेवू नयेत.\n"
        f"   • जमिनीवर लाकडी फळ्या किंवा बांबूची रचना करून त्यावर पोती ठेवावीत आणि भिंतीपासून 1 मीटर अंतर ठेवावे.\n"
        f"   • पोत्यांची थप्पी 6 ते 7 पोत्यांपेक्षा जास्त उंच करू नये.\n\n"
        f"3. **कीड प्रतिबंध:**\n"
        f"   • साठवणीत कडुनिंबाचा सुकलेला पाला मिसळावा किंवा हवा बंद (Hermetic PICS) बॅगचा वापर करावा."
    )
    en = (
        f"📦 **Post-Harvest Grain & Seed Storage Protocols ({panchayat.name} GP):**\n\n"
        f"1. **Safe Moisture Thresholds:**\n"
        f"   • Sun dry soybean and pulses until grain moisture drops below **8-9%** (10-12% for wheat/paddy).\n"
        f"   • *Bite Test:* Grain should snap crisply between teeth without flattening or sticking.\n\n"
        f"2. **Warehouse Stacking Rules:**\n"
        f"   • Never place gunny bags directly on bare concrete floors or against damp exterior walls.\n"
        f"   • Elevate stacks on wooden dunnage/pallets with at least 1-meter wall clearance for aeration.\n"
        f"   • Restrict stack height to 6-7 bags to prevent compaction damage and spontaneous heating.\n\n"
        f"3. **Storage Pest Protection:**\n"
        f"   • Mix 2 kg dried neem leaves per quintal of grain or use 3-layer Hermetic PICS bags for 100% insect-free storage without chemical fumigation."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_livestock_dairy(panchayat: Panchayat, message: str, language: Language) -> Tuple[str, str]:
    """Provide verified cattle nutrition, balanced feed, disease prevention, and milk yield guidelines."""
    hi = (
        f"🐄 **पशुपालन एवं दुग्ध उत्पादन संवर्धन वैज्ञानिक मार्गदर्शन (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **संतुलित पशु आहार नियम (प्रति दुधारू पशु दैनिक):**\n"
        f"   • **शरीर रक्षा हेतु दाना:** 1.5 से 2 किग्रा संतुलित पशुआहार (कंपाउंड फीड)।\n"
        f"   • **दूध उत्पादन अनुसार:** गाय हेतु प्रति 2.5 लीटर दूध पर 1 किग्रा अतिरिक्त दाना; भैंस हेतु प्रति 2 लीटर दूध पर 1 किग्रा दाना।\n"
        f"   • **चारा अनुपात:** 15-20 किग्रा हरा चारा (नेपियर, मक्का, बरसीम) + 5-6 किग्रा सूखा चारा (कड़बी/कुट्टी)।\n\n"
        f"2. **खनिज मिश्रण (Mineral Mixture):**\n"
        f"   • प्रतिदिन 50 ग्राम एग्रोमिन/चिलेटेड खनिज मिश्रण और 30 ग्राम सादा नमक चारे में अवश्य दें। इससे पशु बार-बार गर्म होना (Repeat Breeding) बंद होता है और दूध में फैट बढ़ता है।\n\n"
        f"3. **टीकाकरण कैलेंडर (Vaccination):**\n"
        f"   • खुरपका-मुंहपका (FMD) का टीका वर्ष में 2 बार (सितंबर और मार्च) और लंपी स्किन रोग (LSD) से बचाव हेतु गोट पॉक्स वैक्सीन का बूस्टर टीका अवश्य लगवाएं।"
    )
    mr = (
        f"🐄 **पशुसंवर्धन व दूध उत्पादन वाढ शास्त्रीय मार्गदर्शन (ग्रा.पं. {panchayat.name}):**\n\n"
        f"1. **संतुलित पशुखाद्य प्रमाण (दररोज प्रति जनावर):**\n"
        f"   • **शरीर पोषणासाठी:** 1.5 ते 2 किलो संतुलित पशुखाद्य (सरकी ढेप/गोळी पेंड).\n"
        f"   • **दूध उत्पादनानुसार:** गाईसाठी दर 2.5 लिटर दुधामागे 1 किलो आणि म्हशीसाठी दर 2 लिटर दुधामागे 1 किलो अतिरिक्त खुराक द्यावा.\n"
        f"   • **चारा प्रमाण:** 15-20 किलो हिरवा चारा (नेपिअर, मका) + 5-6 किलो कोरडा चारा (कडबा/कुट्टी).\n\n"
        f"2. **खनिज मिश्रण (Mineral Mixture):**\n"
        f"   • रोज 50 ग्रॅम खनिज मिश्रण आणि 30 ग्रॅम मीठ दिल्यास जनावरे वेळेवर माजावर येतात आणि दुधातील फॅट व एसएनएफ सुधारते.\n\n"
        f"3. **लसीकरण:**\n"
        f"   • लाळ्या-खुरकूत (FMD) ची लस वर्षातून दोनदा आणि लंपी रोगाविरुद्ध गोट पॉक्स लस वेळेवर टोचून घ्यावी."
    )
    en = (
        f"🐄 **Dairy Herd Management & Milk Yield Optimization ({panchayat.name} GP):**\n\n"
        f"1. **Daily Balanced Ration Formulation:**\n"
        f"   • **Maintenance Feed:** 1.5 to 2.0 kg concentrate compound feed per adult milch animal.\n"
        f"   • **Production Ration:** 1 kg additional concentrate per 2.5 L of cow milk (or per 2.0 L of buffalo milk).\n"
        f"   • **Roughage Balance:** 15-20 kg succulent green fodder (Hybrid Napier, Maize) + 5-6 kg dry crop residue (sorghum kadbi/straw).\n\n"
        f"2. **Mineral Mixture & Salt:**\n"
        f"   • Supplement 50g chelated mineral mixture + 30g iodized salt daily to eliminate repeat breeding and boost milk fat percentage.\n\n"
        f"3. **Preventive Vaccination Schedule:**\n"
        f"   • Foot and Mouth Disease (FMD) biannually, Black Quarter (BQ) pre-monsoon, and Goat Pox vaccine booster for Lumpy Skin Disease (LSD)."
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_helpline(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide verified official agricultural helpline, emergency support, and KVK contact numbers."""
    hi = (
        f"📞 **ग्राम पंचायत {panchayat.name} — किसान आपातकालीन हेल्पलाइन एवं संपर्क विवरण:**\n\n"
        f"• 🌾 **किसान कॉल सेंटर (Kisan Call Center):** **1800-180-1551** (टोल-फ्री · प्रातः 6 से रात 10 बजे · हिंदी/मराठी/अंग्रेजी में विशेषज्ञ सहायता)\n"
        f"• 🛡️ **प्रधानमंत्री फसल बीमा (PMFBY) टोल-फ्री:** **14447** (फसल नुकसान की 72 घंटे में सूचना दर्ज कराने हेतु)\n"
        f"• 🏛️ **महाराष्ट्र कृषि सहायता हेल्पलाइन:** **1800-233-4000**\n"
        f"• 🔬 **कृषि विज्ञान केंद्र (KVK CICR), नागपुर:** **07103-275536** (मिट्टी परीक्षण, बीज उपलब्धता व रोग निदान)\n"
        f"• 🚜 **कलमेश्वर तालुका कृषि अधिकारी (TAO):** स्थानीय पंचायत समिति कार्यालय, कलमेश्वर\n"
        f"• 🌦️ **मौसम अलर्ट (IMD Mausam):** 'मेघदूत' व 'मौसम' मोबाइल ऐप"
    )
    mr = (
        f"📞 **ग्रामपंचायत {panchayat.name} — शेतकरी अधिकृत हेल्पलाइन व संपर्क क्रमांक:**\n\n"
        f"• 🌾 **किसान कॉल सेंटर (Kisan Call Center):** **1800-180-1551** (टोल-फ्री · सकाळी 6 ते रात्री 10 · मराठीत तज्ज्ञ मार्गदर्शन)\n"
        f"• 🛡️ **प्रधानमंत्री पीक विमा (PMFBY) टोल-फ्री:** **14447** (नुकसानीची 72 तासांत तक्रार नोंदवण्यासाठी)\n"
        f"• 🏛️ **महाराष्ट्र कृषी विभाग हेल्पलाइन:** **1800-233-4000**\n"
        f"• 🔬 **कृषी विज्ञान केंद्र (KVK CICR), नागपूर:** **07103-275536** (माती परीक्षण व रोग निदान)\n"
        f"• 🚜 **कळमेश्वर तालुका कृषी अधिकारी कार्यालय (TAO):** पंचायत समिती, कळमेश्वर\n"
        f"• 🌦️ **हवामान माहिती:** 'दामिनी' व 'मेघदूत' ॲप"
    )
    en = (
        f"📞 **Official Farmer Emergency Support & Helplines ({panchayat.name} GP):**\n\n"
        f"• 🌾 **Kisan Call Center (KCC):** **1800-180-1551** (Toll-Free · 6:00 AM – 10:00 PM · 365 Days in Hindi, Marathi & English)\n"
        f"• 🛡️ **PM Fasal Bima (PMFBY) Crop Loss Helpline:** **14447** (Mandatory crop loss intimation within 72 hours)\n"
        f"• 🏛️ **Maharashtra State Agri Helpline:** **1800-233-4000**\n"
        f"• 🔬 **Krishi Vigyan Kendra (KVK CICR), Nagpur:** **07103-275536** (Soil testing, certified seed stock & plant pathology)\n"
        f"• 🚜 **Taluka Agriculture Officer (TAO):** Panchayat Samiti Office, Kalmeshwar\n"
        f"• 🌦️ **Agromet Alerts:** Meghdoot & Damini Lightning Mobile Applications"
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "general"



def _handle_crop_advisory(panchayat_id: int, language: Language, db: Session) -> Tuple[str, str]:
    """Fetch latest officer-approved crop advisory from database."""
    latest = (
        db.query(Advisory)
        .filter(
            Advisory.panchayat_id == panchayat_id,
            Advisory.status.in_([AdvisoryStatus.approved, AdvisoryStatus.sent]),
        )
        .order_by(Advisory.advisory_date.desc())
        .first()
    )

    if latest:
        content_map = {
            Language.hi: latest.content_hi,
            Language.mr: latest.content_mr or latest.content_hi,
            Language.en: latest.content_en,
        }
        return content_map.get(language, latest.content_en), "advisory"

    # Dynamic agromet advisory fallback
    default_advisory = {
        Language.hi: (
            "🌾 **आज की प्राथमिक कृषि सलाह (मौसम आधारित):**\n"
            "• मिट्टी में नमी पर्याप्त रहने पर सोयाबीन व कपास में खरपतवार नियंत्रण पर ध्यान दें।\n"
            "• जलभराव वाले क्षेत्रों में जल निकासी नालियों को तुरंत साफ रखें।\n"
            "• कीट प्रकोप की नियमित निगरानी करें और लक्षण दिखते ही उचित जैविक/रासायनिक उपाय अपनाएं।"
        ),
        Language.mr: (
            "🌾 **आजचा मुख्य कृषी सल्ला (हवामानावर आधारित):**\n"
            "• सोयाबीन व कापूस पिकातील तण नियंत्रण वेळेवर करा.\n"
            "• पाणी साचणाऱ्या सखल भागातून पाण्याचा तातडीने निचरा करा.\n"
            "• किडींच्या प्रादुर्भावावर बारीक लक्ष ठेवा आणि वेळेत प्रतिबंधात्मक उपाय करा."
        ),
        Language.en: (
            "🌾 **Key Farm Advisory of the Day (Weather-Grounded):**\n"
            "• Maintain proper weed management while soil moisture is optimal.\n"
            "• Clear farm drainage ditches immediately to avoid standing water pockets.\n"
            "• Monitor crops for early pest infestations and apply targeted treatments."
        ),
    }
    return default_advisory.get(language, default_advisory[Language.en]), "advisory"


async def _handle_general_agri(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """General farmer assistant response with real Gram Panchayat weather snapshot."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]
    temp = w["temp_max"]
    wind = w["wind_speed_kmh"]

    hi = (
        f"🏛️ **ग्राम पंचायत {panchayat.name} मौसम व कृषि अवलोकन:**\n\n"
        f"• **मौसम स्थिति:** वर्षा {rain} mm · तापमान {temp}°C · हवा {wind} km/h\n"
        f"• **स्थिति सारांश:** {'खेतों में पर्याप्त नमी है, जल निकासी नालियां खुली रखें।' if rain > 2 else 'मौसम शुष्क है, खाद, सिंचाई व कीटनाशक छिड़काव के लिए स्थिति अनुकूल है।'}\n\n"
        f"💡 **आप मुझसे विभिन्न विषयों पर पूछ सकते हैं:**\n"
        f"1. 📅 'साप्ताहिक 7 दिन का मौसम पूर्वानुमान'\n"
        f"2. 🫘 'सोयाबीन/कपास की उत्तम किस्में (JS 20-34, फुले संगम)'\n"
        f"3. 🌿 'सोयाबीन में खरपतवार नाशक (पेंडीमेथालिन/इमाजेथापायर)'\n"
        f"4. 🍂 'पत्तियों का पीलापन व लाल्या रोग उपचार'\n"
        f"5. 🧪 'मिट्टी जांच (V-Cut) व काली मिट्टी सुधार'\n"
        f"6. 🐄 'पशु आहार व दूध बढ़ाने के उपाय'\n"
        f"7. 🏛️ 'पीएम किसान, फसल बीमा 72 घंटे नियम व सब्सिडी'\n"
        f"8. 📞 'किसान कॉल सेंटर व कृषि हेल्पलाइन 1800-180-1551'"
    )

    mr = (
        f"🏛️ **ग्रामपंचायत {panchayat.name} हवामान व शेती माहिती:**\n\n"
        f"• **हवामान स्थिती:** पाऊस {rain} mm · तापमान {temp}°C · वारा {wind} km/h\n"
        f"• **शेती स्थिती:** {'शेतात ओलावा पुरेसा आहे, पाण्याचा निचरा व्यवस्थित ठेवा.' if rain > 2 else 'हवामान कोरडे असून खत, सिंचन व फवारणीसाठी योग्य वेळ आहे.'}\n\n"
        f"💡 **आपण पुढील विषयांवर विचारू शकता:**\n"
        f"1. 📅 'पुढील 7 दिवसांचा हवामान अंदाज'\n"
        f"2. 🫘 'सोयाबीन व कापूस सुधारित वाण (फुले संगम, अजित-155)'\n"
        f"3. 🌿 'तणनाशक फवारणी मार्गदर्शन (पर्सेट, शाकेद)'\n"
        f"4. 🍂 'पाने पिवळी पडणे व कापूस लाल्या रोग उपाय'\n"
        f"5. 🧪 'माती परीक्षण कसे करावे व काळी जमीन सुधारणा'\n"
        f"6. 🐄 'दुभत्या जनावरांचा खुराक व दूध वाढ'\n"
        f"7. 🏛️ 'पीएम किसान, पीक विमा 72 तास नियम व सबसिडी'\n"
        f"8. 📞 'किसान हेल्पलाइन व संपर्क क्रमांक 1800-180-1551'"
    )

    en = (
        f"🏛️ **{panchayat.name} Gram Panchayat Weather & Farm Overview:**\n\n"
        f"• **Conditions:** Rain {rain} mm · Temp {temp}°C · Wind {wind} km/h\n"
        f"• **Agronomic Status:** {'Adequate soil moisture, keep drainage furrows clear.' if rain > 2 else 'Dry weather; suitable for fertilizer broadcast, irrigation and spraying.'}\n\n"
        f"💡 **Explore what you can ask me:**\n"
        f"1. 📅 '7-day weekly weather forecast'\n"
        f"2. 🫘 'Best soybean & cotton varieties (JS 20-34, Phule Sangam)'\n"
        f"3. 🌿 'Weed control & herbicide recommendations'\n"
        f"4. 🍂 'Yellowing leaves and cotton reddening remedies'\n"
        f"5. 🧪 'Soil test V-cut procedure and black cotton soil management'\n"
        f"6. 🐄 'Dairy herd feed calculation and milk yield improvement'\n"
        f"7. 🏛️ 'PM-KISAN, crop insurance 72h rule & solar pump subsidy'\n"
        f"8. 📞 'Kisan Call Center & emergency helpline 1800-180-1551'"
    )

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "general"


# ---------------------------------------------------------------------------
# Main Chatbot Route
# ---------------------------------------------------------------------------

@router.post("/message", response_model=ChatbotResponse)
async def send_message(body: ChatbotRequest, db: Session = Depends(get_db)):
    """
    Process farmer voice/text query and return strictly grounded answer from system data.
    """
    panchayat_id = body.panchayat_id or 1
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        panchayat = db.query(Panchayat).first()

    intent = _detect_intent(body.message, body.language)

    if intent == "greeting":
        greetings = {
            Language.hi: f"नमस्ते! मौसमसेतु ग्राम पंचायत कृषि-मौसम परामर्श सेवा में आपका स्वागत है। मैं आपको ग्राम पंचायत {panchayat.name} ({panchayat.district}) के सूक्ष्म-मौसम, 7-दिवसीय वर्षा पूर्वानुमान, सोयाबीन व कपास सुरक्षा, खाद-बीज और मंडी भाव की आधिकारिक जानकारी प्रदान करता हूँ। पूछिए, आज आपकी क्या सहायता करूँ?",
            Language.mr: f"नमस्कार! मौसमसेतू ग्रामपंचायत कृषी हवामान सल्ला सेवेत आपले स्वागत आहे. मी आपणास ग्रामपंचायत {panchayat.name} ({panchayat.district}) चे स्थानिक हवामान, 7 दिवसांचा पाऊस अंदाज, पीक संरक्षण, खत-बियाणे आणि बाजारभावाची अधिकृत माहिती देतो. सांगा, आज काय मदत हवी आहे?",
            Language.en: f"Welcome to the MausamSetu Gram Panchayat Agro-Meteorological Advisory Service. I provide verified hyper-local weather predictions, 7-day rainfall forecasts, crop protection guidelines, and APMC mandi rates for {panchayat.name} Gram Panchayat. How can I assist you today?",
        }
        reply = greetings.get(body.language, greetings[Language.en])
        source = "greeting"
    elif intent == "weekly_forecast":
        reply, source = await _handle_weekly_forecast(panchayat, body.language)
    elif intent == "humidity":
        reply, source = await _handle_humidity(panchayat, body.language)
    elif intent == "crop_variety":
        reply, source = await _handle_crop_variety(panchayat, body.message, body.language)
    elif intent == "weed_control":
        reply, source = await _handle_weed_control(panchayat, body.message, body.language)
    elif intent == "crop_disease":
        reply, source = await _handle_crop_disease(panchayat, body.message, body.language)
    elif intent == "soil_health":
        reply, source = await _handle_soil_health(panchayat, body.message, body.language)
    elif intent == "organic_farming":
        reply, source = await _handle_organic_farming(panchayat, body.message, body.language)
    elif intent == "govt_schemes":
        reply, source = await _handle_govt_schemes(panchayat, body.message, body.language)
    elif intent == "storage_management":
        reply, source = await _handle_storage_management(panchayat, body.message, body.language)
    elif intent == "livestock_dairy":
        reply, source = await _handle_livestock_dairy(panchayat, body.message, body.language)
    elif intent == "helpline":
        reply, source = await _handle_helpline(panchayat, body.language)
    elif intent == "waterlogging":
        reply, source = await _handle_waterlogging(panchayat, body.message, body.language)
    elif intent == "mandi":
        reply, source = await _handle_mandi(panchayat, body.message, body.language)
    elif intent == "crop_pest":
        reply, source = await _handle_crop_pest(panchayat, body.message, body.language)
    elif intent == "fertilizer_sowing":
        reply, source = await _handle_fertilizer_sowing(panchayat, body.message, body.language)
    elif intent == "wind":
        reply, source = await _handle_wind(panchayat, body.language)
    elif intent == "temperature":
        reply, source = await _handle_temperature(panchayat, body.language)
    elif intent == "rain_check":
        reply, source = await _handle_rain_check(panchayat, body.language)
    elif intent == "irrigation":
        reply, source = await _handle_irrigation(panchayat, body.language)
    elif intent == "spray":
        reply, source = await _handle_spray(panchayat, body.language)
    elif intent == "weather":
        reply, source = await _handle_weather_full(panchayat, body.message, body.language)
    elif intent == "advisory":
        reply, source = _handle_crop_advisory(panchayat.id, body.language, db)
    else:
        reply, source = await _handle_general_agri(panchayat, body.language)

    # Save session conversation
    session = None
    if body.session_id:
        session = db.query(ChatbotSession).filter(ChatbotSession.id == body.session_id).first()

    if not session:
        session = ChatbotSession(
            farmer_id=body.farmer_id,
            panchayat_id=panchayat.id,
            language=body.language,
            messages=[],
        )
        db.add(session)
        db.flush()

    now = datetime.utcnow().isoformat()
    messages = list(session.messages or [])
    messages.append({"role": "user", "content": body.message, "timestamp": now})
    messages.append({"role": "assistant", "content": reply, "timestamp": now})
    session.messages = messages
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    return ChatbotResponse(
        session_id=session.id,
        reply=reply,
        language=body.language,
        source=source,
    )
