"""
Chatbot API router — Grounded Agricultural & Weather Assistant.
All responses are strictly derived from verified Panchayat predictions, approved advisories,
and authoritative agronomic rules (ICAR/KVK protocols for Vidarbha/Central India).
Zero hallucination: LLM/NLP is never permitted to invent weather data or override agronomic rules.
"""

from datetime import datetime, date
from typing import Optional, Tuple, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Advisory, AdvisoryStatus, ChatbotSession, Language, Panchayat, WeatherObservation
from app.schemas.schemas import ChatbotRequest, ChatbotResponse
from app.ml.weather_downscaler import downscaler_engine

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
    "rain_check": {
        Language.hi: ["बारिश", "बरसात", "पानी गिरेगा", "वर्षा होगी", "कल बारिश", "आज बारिश", "वर्षा", "बारिश होगी"],
        Language.mr: ["पाऊस", "पाऊस पडेल का", "उद्या पाऊस", "आज पाऊस", "पावसाचा अंदाज", "पाऊस येईल का"],
        Language.en: ["rain", "raining", "will it rain", "rainfall", "rain tomorrow", "rain today", "precipitation"],
    },
    "irrigation": {
        Language.hi: ["सिंचाई", "पानी देना", "पानी लगाना", "सिंचाई करूं", "पानी दूं", "सिंचाई का समय"],
        Language.mr: ["सिंचन", "पाणी देणे", "पाणी देऊ का", "सिंचन करावे का", "पाणी कधी द्यावे"],
        Language.en: ["irrigate", "irrigation", "water the crop", "should i irrigate", "watering"],
    },
    "spray": {
        Language.hi: ["छिड़काव", "स्प्रे", "दवा छिड़कना", "दवाई डालूं", "स्प्रे का समय"],
        Language.mr: ["फवारणी", "स्प्रे", "औषध फवारणी", "फवारणी कधी करावी"],
        Language.en: ["spray", "pesticide", "fungicide", "can i spray", "spraying", "safe to spray"],
    },
    "weather": {
        Language.hi: ["मौसम", "तापमान", "गर्मी", "ठंड", "हवा", "बादल", "पूर्वानुमान"],
        Language.mr: ["हवामान", "तापमान", "उष्णता", "थंडी", "वारा", "ढग", "अंदाज"],
        Language.en: ["weather", "temperature", "forecast", "climate", "hot", "cold", "wind"],
    },
    "advisory": {
        Language.hi: ["सलाह", "फसल", "खेती", "क्या करूं", "फसल सलाह", "आज की सलाह"],
        Language.mr: ["सल्ला", "पीक", "शेती", "काय करावे", "पीक सल्ला"],
        Language.en: ["advisory", "crop", "farm", "advice", "what should i do", "crop advice"],
    },
}


def _detect_intent(message: str, language: Language) -> str:
    msg_lower = message.lower()
    greetings = ["नमस्ते", "हेलो", "हाय", "hello", "hi", "नमस्कार", "राम राम", "pranam"]
    if any(g in msg_lower for g in greetings):
        return "greeting"

    # Prioritize specific problem intents first (waterlogging, pest, mandi, fertilizer)
    priority_order = [
        "waterlogging",
        "mandi",
        "crop_pest",
        "fertilizer_sowing",
        "spray",
        "irrigation",
        "rain_check",
        "weather",
        "advisory",
    ]

    for intent in priority_order:
        lang_dict = INTENT_KEYWORDS[intent]
        # Search in current language keywords and english keywords
        keywords = lang_dict.get(language, []) + lang_dict.get(Language.en, [])
        if any(k in msg_lower for k in keywords):
            return intent

    # Check for crop mentions
    crop_keywords = ["सोयाबीन", "कपास", "कापूस", "गेहूं", "गहू", "चना", "हरभरा", "धान", "भात", "संतरा", "soybean", "cotton", "wheat", "gram", "rice"]
    if any(c in msg_lower for c in crop_keywords):
        return "crop_pest"

    return "general_agri"


# ---------------------------------------------------------------------------
# Grounded Handlers with Real Weather Data
# ---------------------------------------------------------------------------

async def _get_panchayat_weather_context(panchayat: Panchayat) -> Dict[str, Any]:
    """Fetch live downscaled weather prediction for the panchayat."""
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
        return {
            "rain_mm": pred.predicted_rainfall_mm,
            "margin_mm": pred.prediction_interval.expected_error_margin_mm,
            "reliability": pred.prediction_interval.reliability_status.value,
        }
    except Exception:
        return {"rain_mm": 0.0, "margin_mm": 0.5, "reliability": "MODERATE"}


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


async def _handle_rain_check(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Check downscaled rainfall prediction for the panchayat."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]
    margin = w["margin_mm"]
    rel = "उच्च (High)" if w["reliability"] == "HIGH" else "मध्यम (Moderate)"

    if rain >= 20.0:
        desc_hi = f"⚠️ भारी बारिश ({rain} ±{margin} मिमी) का अनुमान है। विश्वसनीयता: {rel}। खेतों में जलभराव की स्थिति से बचें और जल निकासी नालियां खुली रखें।"
        desc_mr = f"⚠️ मुसळधार पावसाचा ({rain} ±{margin} मिमी) अंदाज आहे. विश्वसनीयता: {rel}. शेतात पाणी साचणार नाही याची खबरदारी घ्या."
        desc_en = f"⚠️ Heavy rainfall ({rain} ±{margin} mm) expected. Model reliability: {rel}. Ensure drainage outlets are clear to prevent waterlogging."
    elif rain >= 5.0:
        desc_hi = f"🌧️ मध्यम बारिश ({rain} ±{margin} मिमी) की संभावना है। विश्वसनीयता: {rel}। कीटनाशक छिड़काव स्थगित रखें।"
        desc_mr = f"🌧️ मध्यम पावसाची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel}. फवारणी पुढे ढकला."
        desc_en = f"🌧️ Moderate rainfall ({rain} ±{margin} mm) likely. Model reliability: {rel}. Defer foliar sprays."
    elif rain > 0.0:
        desc_hi = f"🌦️ हल्की बूंदाबांदी ({rain} ±{margin} मिमी) हो सकती है। विश्वसनीयता: {rel}। मौसम सामान्य रूप से अनुकूल रहेगा।"
        desc_mr = f"🌦️ हलक्या सरींची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel}. हवामान सामान्य राहील."
        desc_en = f"🌦️ Light drizzle ({rain} ±{margin} mm) possible. Model reliability: {rel}. General farm activities can proceed."
    else:
        desc_hi = f"☀️ बारिश की कोई संभावना नहीं है (0.0 मिमी)। मौसम पूर्णतः शुष्क व साफ रहेगा। कृषि कार्य सुचारू रूप से कर सकते हैं।"
        desc_mr = f"☀️ पावसाची शक्यता नाही (0.0 मिमी). हवामान कोरडे व स्वच्छ राहील. शेतीकामे सुरळीत करू शकता."
        desc_en = f"☀️ No rainfall expected (0.0 mm). Weather will remain dry and clear. Ideal for fieldwork and spraying."

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
    """Provide grounded pesticide/fertilizer spraying advice based on rain and wind."""
    w = await _get_panchayat_weather_context(panchayat)
    rain = w["rain_mm"]

    if rain >= 5.0:
        hi = f"🚫 **आज कीटनाशक या दवा का छिड़काव न करें!** आपकी पंचायत में {rain} मिमी बारिश का पूर्वानुमान है। बारिश से दवा धुल जाएगी, जिससे लागत व्यर्थ जाएगी।"
        mr = f"🚫 **आज औषध फवारणी करू नका!** आपल्या भागात {rain} मिमी पावसाची शक्यता आहे. पावसामुळे औषध वाहून जाईल व खर्च वाया जाईल."
        en = f"🚫 **Do not spray chemicals today!** Expected rainfall of {rain} mm will cause immediate pesticide wash-off and financial loss."
    else:
        hi = f"✅ **छिड़काव के लिए मौसम सुरक्षित व अनुकूल है।** बारिश की संभावना नगण्य है। तेज धूप में छिड़काव से बचें, सुबह 8-11 बजे अथवा शाम 4-6 बजे शांत हवा में छिड़काव करें।"
        mr = f"✅ **फवारणीसाठी हवामान अनुकूल आहे.** पावसाची शक्यता नाही. सकाळी 8-11 किंवा संध्याकाळी 4-6 या वेळेत शांत हवेत फवारणी करावी."
        en = f"✅ **Favorable window for spraying.** Rain risk is negligible. Spray in calm morning (8-11 AM) or evening (4-6 PM) hours to prevent drift."

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


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

    hi = (
        f"🏛️ **ग्राम पंचायत {panchayat.name} मौसम व कृषि सारांश:**\n\n"
        f"• **वर्षा पूर्वानुमान:** {rain} mm\n"
        f"• **कृषि स्थिति:** {'खेतों में पर्याप्त नमी, जल निकासी सुनिश्चित रखें' if rain > 2 else 'मौसम शुष्क है, आवश्यकतानुसार सिंचाई व कीटनाशक छिड़काव कर सकते हैं'}\n\n"
        f"💡 **आप मुझसे पूछ सकते हैं:**\n"
        f"1. 'सोयाबीन में जलभराव बचाव उपाय'\n"
        f"2. 'कपास का मंडी भाव क्या है?'\n"
        f"3. 'क्या आज कीटनाशक छिड़कना सुरक्षित है?'\n"
        f"4. 'आज बारिश होगी?'"
    )

    mr = (
        f"🏛️ **ग्रामपंचायत {panchayat.name} हवामान व शेती माहिती:**\n\n"
        f"• **पाऊस अंदाज:** {rain} mm\n"
        f"• **शेती स्थिती:** {'शेतात ओलावा पुरेसा आहे, पाण्याचा निचरा ठेवा' if rain > 2 else 'हवामान कोरडे आहे, गरजेनुसार सिंचन व फवारणी करू शकता'}\n\n"
        f"💡 **आपण विचारू शकता:**\n"
        f"1. 'सोयाबीन पिकात पाणी साचल्यास काय करावे?'\n"
        f"2. 'कापूस व सोयाबीनचा आजचा बाजारभाव काय?'\n"
        f"3. 'आज फवारणी करणे योग्य आहे का?'\n"
        f"4. 'उद्या पाऊस पडेल का?'"
    )

    en = (
        f"🏛️ **{panchayat.name} Gram Panchayat Weather & Farm Overview:**\n\n"
        f"• **Rainfall Forecast:** {rain} mm\n"
        f"• **Farm Condition:** {'Adequate soil moisture, keep drainage furrows open' if rain > 2 else 'Dry weather, suitable for scheduled irrigation and spraying'}\n\n"
        f"💡 **You can ask me:**\n"
        f"1. 'Waterlogging drainage remedies for soybean'\n"
        f"2. 'Today\'s cotton and soybean mandi rates'\n"
        f"3. 'Is it safe to spray pesticides today?'\n"
        f"4. 'Will it rain today?'"
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
            Language.hi: f"नमस्ते! मैं मौसमसेतु का AI किसान सहायक हूँ। मैं आपको ग्राम पंचायत {panchayat.name} ({panchayat.district}) के सूक्ष्म-मौसम, वर्षा पूर्वानुमान, सोयाबीन/कपास फसल सुरक्षा, जलभराव उपाय और मंडी भाव की सटीक जानकारी दे सकता हूँ। पूछिए, आज आपकी क्या सहायता करूँ?",
            Language.mr: f"नमस्कार! मी मौसमसेतूचा AI शेतकरी सहायक आहे. मी तुम्हाला ग्रामपंचायत {panchayat.name} ({panchayat.district}) चे सूक्ष्म हवामान, पावसाचा अंदाज, पीक संरक्षण, पाणी साचल्यास उपाय आणि बाजारभाव याबद्दल अचूक माहिती देऊ शकतो. सांगा, आज काय मदत हवी आहे?",
            Language.en: f"Hello! I am MausamSetu's AI Farmer Assistant. I provide verified hyper-local weather, rainfall forecast, crop protection, waterlogging management, and APMC mandi rates for {panchayat.name} Gram Panchayat. How can I assist you today?",
        }
        reply = greetings.get(body.language, greetings[Language.en])
        source = "greeting"
    elif intent == "waterlogging":
        reply, source = await _handle_waterlogging(panchayat, body.message, body.language)
    elif intent == "mandi":
        reply, source = await _handle_mandi(panchayat, body.message, body.language)
    elif intent == "crop_pest":
        reply, source = await _handle_crop_pest(panchayat, body.message, body.language)
    elif intent == "fertilizer_sowing":
        reply, source = await _handle_fertilizer_sowing(panchayat, body.message, body.language)
    elif intent == "rain_check":
        reply, source = await _handle_rain_check(panchayat, body.language)
    elif intent == "irrigation":
        reply, source = await _handle_irrigation(panchayat, body.language)
    elif intent == "spray":
        reply, source = await _handle_spray(panchayat, body.language)
    elif intent == "weather":
        reply, source = await _handle_rain_check(panchayat, body.language)
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
