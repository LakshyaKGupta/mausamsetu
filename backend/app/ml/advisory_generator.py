"""
MausamSetu ML Pipeline — Advisory Generator

Architecture:
- Weather inputs × Crop type → Rule-based advisory templates
- Confidence score determines whether ML advisory or IMD fallback is served
- Multilingual output: English, Hindi, Marathi

Design principle: No LLM hallucination. All advisory text is template-driven,
tied to real weather thresholds. Templates are authored by agronomists.
"""

from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Confidence Threshold
# ---------------------------------------------------------------------------

HIGH_CONFIDENCE = 0.85
MEDIUM_CONFIDENCE = 0.60


@dataclass
class WeatherInput:
    temperature_max: float
    temperature_min: float
    rainfall_mm: float
    humidity_pct: float
    wind_speed_kmh: float
    cloud_cover_pct: float


@dataclass
class AdvisoryOutput:
    content_en: str
    content_hi: str
    content_mr: str
    confidence_score: float
    is_imd_fallback: bool
    ml_explanation: dict
    weather_snapshot: dict


# ---------------------------------------------------------------------------
# Advisory Templates (en / hi / mr)
# ---------------------------------------------------------------------------

# Structure: templates[crop][condition] = {en, hi, mr}
# Conditions: rain_heavy, rain_moderate, dry_hot, dry_mild, humid_mild, optimal

ADVISORY_TEMPLATES: dict[str, dict[str, dict[str, str]]] = {
    "wheat": {
        "rain_heavy": {
            "en": "Heavy rainfall expected. Ensure proper drainage in wheat fields. Avoid irrigation. Watch for waterlogging and fungal disease (yellow rust). Postpone pesticide spray.",
            "hi": "भारी वर्षा की संभावना है। गेहूं के खेतों में जल निकासी सुनिश्चित करें। सिंचाई न करें। जलभराव और पीले रतुआ रोग पर ध्यान दें। कीटनाशक छिड़काव टालें।",
            "mr": "जड पाऊस अपेक्षित. गव्हाच्या शेतात निचरा सुनिश्चित करा. सिंचन टाळा. जलसंचय आणि पिवळ्या गंजाच्या रोगावर लक्ष ठेवा. कीटकनाशक फवारणी पुढे ढकला.",
        },
        "rain_moderate": {
            "en": "Moderate rainfall expected. Good conditions for wheat growth. No irrigation needed. Monitor for aphids and rust.",
            "hi": "मध्यम वर्षा की संभावना है। गेहूं की वृद्धि के लिए अच्छी स्थिति है। सिंचाई की आवश्यकता नहीं। एफिड और रतुआ की निगरानी करें।",
            "mr": "मध्यम पाऊस अपेक्षित. गव्हाच्या वाढीसाठी चांगली परिस्थिती. सिंचनाची गरज नाही. ऍफिड आणि गंजाचे निरीक्षण करा.",
        },
        "dry_hot": {
            "en": "High temperatures and dry conditions. Irrigate wheat fields immediately if at jointing/heading stage. Apply protective mulch. Risk of heat stress.",
            "hi": "उच्च तापमान और शुष्क स्थिति। गेहूं में तुरंत सिंचाई करें यदि जोड़/शीर्ष अवस्था में हो। सुरक्षात्मक मल्च लगाएं। गर्मी के तनाव का खतरा।",
            "mr": "उच्च तापमान आणि कोरडी परिस्थिती. जोड/शीर्ष अवस्थेत असल्यास गव्हाला त्वरित पाणी द्या. संरक्षक आच्छादन लावा. उष्णतेच्या ताणाचा धोका.",
        },
        "dry_mild": {
            "en": "Mild and dry weather. Suitable for wheat sowing and early growth. Consider light irrigation if topsoil is dry. Good conditions for field operations.",
            "hi": "हल्का और शुष्क मौसम। गेहूं की बुवाई और प्रारंभिक वृद्धि के लिए उपयुक्त। यदि ऊपरी मिट्टी सूखी हो तो हल्की सिंचाई करें।",
            "mr": "सौम्य आणि कोरडे हवामान. गव्हाच्या पेरणीसाठी आणि सुरुवातीच्या वाढीसाठी योग्य. वरची माती कोरडी असल्यास हलके सिंचन करा.",
        },
        "humid_mild": {
            "en": "Humid and mild conditions. Monitor wheat for fungal diseases. Ensure good air circulation. Avoid overhead irrigation.",
            "hi": "आर्द्र और हल्की स्थिति। गेहूं में फफूंद रोगों की निगरानी करें। अच्छा वायु संचार सुनिश्चित करें। ऊपरी सिंचाई से बचें।",
            "mr": "दमट आणि सौम्य परिस्थिती. गव्हातील बुरशीजन्य रोगांचे निरीक्षण करा. चांगले वायु परिसंचरण सुनिश्चित करा.",
        },
        "optimal": {
            "en": "Optimal weather conditions for wheat. Continue regular crop management practices. Good window for fertilizer application.",
            "hi": "गेहूं के लिए अनुकूल मौसम। नियमित फसल प्रबंधन जारी रखें। उर्वरक प्रयोग के लिए अच्छा समय।",
            "mr": "गव्हासाठी आदर्श हवामान. नियमित पीक व्यवस्थापन सुरू ठेवा. खत वापरण्यासाठी चांगली संधी.",
        },
    },
    "cotton": {
        "rain_heavy": {
            "en": "Heavy rainfall alert. Ensure cotton fields have adequate drainage. High humidity increases bollworm and fungal risk. Postpone any chemical applications.",
            "hi": "भारी वर्षा चेतावनी। कपास के खेतों में पर्याप्त जल निकासी सुनिश्चित करें। अधिक आर्द्रता से बॉलवर्म और फंगल खतरा बढ़ता है।",
            "mr": "जड पावसाचा इशारा. कापसाच्या शेतात पुरेसा निचरा सुनिश्चित करा. जास्त आर्द्रता बोंड अळी आणि बुरशीचा धोका वाढवते.",
        },
        "rain_moderate": {
            "en": "Moderate rain expected. Good for cotton boll development. Monitor for pink bollworm. Drainage should be adequate.",
            "hi": "मध्यम वर्षा की संभावना। कपास के टिंडे विकास के लिए अच्छा। गुलाबी सुंडी की निगरानी करें।",
            "mr": "मध्यम पाऊस अपेक्षित. कापसाच्या बोंड विकासासाठी चांगले. गुलाबी बोंड अळीचे निरीक्षण करा.",
        },
        "dry_hot": {
            "en": "Hot and dry conditions. Cotton requires irrigation at flowering and boll filling stages. Watch for spider mites and whitefly in dry spells.",
            "hi": "गर्म और शुष्क स्थिति। कपास को फूल और टिंडे भरने की अवस्था में सिंचाई चाहिए। सूखे में मकड़ी के कीट और सफेद मक्खी पर ध्यान दें।",
            "mr": "गरम आणि कोरडी परिस्थिती. फुलोरा आणि बोंड भरण्याच्या अवस्थेत कापसाला सिंचन आवश्यक. कोरड्या काळात कोळी माइट आणि पांढरी माशी.",
        },
        "dry_mild": {
            "en": "Mild dry conditions. Suitable for land preparation and early cotton planting. Monitor soil moisture.",
            "hi": "हल्की शुष्क स्थिति। भूमि तैयारी और कपास की प्रारंभिक बुवाई के लिए उपयुक्त।",
            "mr": "सौम्य कोरडी परिस्थिती. जमीन तयार करण्यासाठी आणि कापसाच्या लवकर लागवडीसाठी योग्य.",
        },
        "humid_mild": {
            "en": "Humid conditions. Risk of grey mildew and leaf curl virus. Scout fields regularly. Avoid excess irrigation.",
            "hi": "आर्द्र स्थिति। ग्रे मिल्ड्यू और पत्ती मुड़न विषाणु का खतरा। नियमित निगरानी करें।",
            "mr": "दमट परिस्थिती. राखाडी भुरी आणि पान कुरळे विषाणूचा धोका. नियमित शेत पाहणी करा.",
        },
        "optimal": {
            "en": "Optimal conditions for cotton. Good time for top-dressing nitrogen if at vegetative stage. Continue regular IPM practices.",
            "hi": "कपास के लिए अनुकूल स्थिति। वानस्पतिक अवस्था में नाइट्रोजन की टॉप-ड्रेसिंग का अच्छा समय।",
            "mr": "कापसासाठी आदर्श परिस्थिती. वनस्पती अवस्थेत नायट्रोजन टॉप-ड्रेसिंगसाठी चांगला वेळ.",
        },
    },
    "soybean": {
        "rain_heavy": {
            "en": "Heavy rain warning. Drain soybean fields immediately. Risk of pod rot and Phytophthora root rot. Avoid field entry during wet conditions.",
            "hi": "भारी वर्षा चेतावनी। सोयाबीन के खेतों में तुरंत जल निकासी करें। फली सड़न और फाइटोफ्थोरा जड़ सड़न का खतरा।",
            "mr": "जड पावसाचा इशारा. सोयाबीनच्या शेतातून त्वरित पाणी काढा. शेंग सडणे आणि मुळ कुज रोगाचा धोका.",
        },
        "rain_moderate": {
            "en": "Moderate rain. Good for soybean at pod filling stage. Ensure no waterlogging. Monitor for pod borer.",
            "hi": "मध्यम वर्षा। फली भरने की अवस्था में सोयाबीन के लिए अच्छा। जलभराव न हो। फली सुंडी की निगरानी।",
            "mr": "मध्यम पाऊस. शेंग भरण्याच्या अवस्थेत सोयाबीनसाठी चांगले. जलसंचय नको. शेंग अळीचे निरीक्षण.",
        },
        "dry_hot": {
            "en": "High heat and dry conditions. Critical irrigation required at flowering and pod filling. Risk of flower drop and poor pod set.",
            "hi": "अत्यधिक गर्मी और शुष्कता। फूल और फली भरने पर आवश्यक सिंचाई। फूल झड़ने का खतरा।",
            "mr": "जास्त उष्णता आणि कोरडेपणा. फुलोरा आणि शेंग भरण्यावर सिंचन आवश्यक. फूल गळण्याचा धोका.",
        },
        "dry_mild": {
            "en": "Mild dry weather. Suitable for soybean sowing. Ensure adequate seed bed moisture.",
            "hi": "हल्का शुष्क मौसम। सोयाबीन की बुवाई के लिए उपयुक्त। पर्याप्त नमी सुनिश्चित करें।",
            "mr": "सौम्य कोरडे हवामान. सोयाबीन पेरणीसाठी योग्य. पुरेशी बियाणे बेड ओलावा सुनिश्चित करा.",
        },
        "humid_mild": {
            "en": "Humid mild conditions. Monitor soybean for rust and bacterial pustule. Apply preventive fungicide if required.",
            "hi": "आर्द्र हल्की स्थिति। सोयाबीन में रतुआ और जीवाणु छाले की निगरानी। आवश्यकता पर फफूंदनाशक।",
            "mr": "दमट सौम्य परिस्थिती. सोयाबीनमध्ये गंज आणि जीवाणू फोडांचे निरीक्षण करा. आवश्यक असल्यास बुरशीनाशक.",
        },
        "optimal": {
            "en": "Optimal conditions. Good time for inter-cultivation and weed management in soybean. Monitor regularly.",
            "hi": "अनुकूल स्थिति। सोयाबीन में अंतः कृषि और खरपतवार प्रबंधन का अच्छा समय।",
            "mr": "आदर्श परिस्थिती. सोयाबीनमध्ये आंतरमशागत आणि तण व्यवस्थापनासाठी चांगला वेळ.",
        },
    },
    "rice": {
        "rain_heavy": {
            "en": "Heavy rain expected. Check bund integrity to prevent flooding of rice paddies. Risk of blast and sheath blight in high humidity.",
            "hi": "भारी वर्षा की संभावना। धान के खेतों में बाढ़ रोकने के लिए मेड़ देखें। उच्च आर्द्रता में ब्लास्ट और शीथ ब्लाइट का खतरा।",
            "mr": "जड पाऊस अपेक्षित. भात शेतातील पूर रोखण्यासाठी बांध तपासा. जास्त आर्द्रतेत ब्लास्ट आणि शीथ ब्लाइटचा धोका.",
        },
        "rain_moderate": {
            "en": "Good rainfall for transplanted rice. Monitor water level at 2–5 cm. Ideal for vegetative growth.",
            "hi": "रोपाई वाले धान के लिए अच्छी वर्षा। 2-5 सेमी जल स्तर बनाए रखें। वानस्पतिक वृद्धि के लिए आदर्श।",
            "mr": "लावणीच्या भातासाठी चांगला पाऊस. 2-5 सेमी जल पातळी राखा. वनस्पती वाढीसाठी आदर्श.",
        },
        "dry_hot": {
            "en": "Hot and dry conditions. Maintain adequate irrigation in rice paddies. Risk of spikelet sterility during panicle initiation. Avoid water stress.",
            "hi": "गर्म और शुष्क स्थिति। धान के खेतों में पर्याप्त सिंचाई बनाए रखें। पुष्पगुच्छ शुरुआत पर बांझपन का खतरा।",
            "mr": "गरम आणि कोरडी परिस्थिती. भात शेतात पुरेसे सिंचन राखा. पानकणीस सुरुवातीला नापीक होण्याचा धोका.",
        },
        "dry_mild": {
            "en": "Mild dry conditions. Suitable for land leveling and nursery bed preparation for rice.",
            "hi": "हल्की शुष्क स्थिति। धान के लिए भूमि समतलीकरण और नर्सरी बेड तैयारी के लिए उपयुक्त।",
            "mr": "सौम्य कोरडी परिस्थिती. भातासाठी जमीन सपाट करणे आणि रोपवाटिका बेड तयार करण्यासाठी योग्य.",
        },
        "humid_mild": {
            "en": "Humid mild weather. Risk of brown planthopper and leaf folder in rice. Scout fields. Ensure proper water management.",
            "hi": "आर्द्र हल्का मौसम। धान में भूरा पौधा फुदका और पत्ता मोड़क का खतरा। निगरानी करें।",
            "mr": "दमट सौम्य हवामान. भातात तपकिरी तुडतुडे आणि पान दुमडणारे कीडचा धोका. निरीक्षण करा.",
        },
        "optimal": {
            "en": "Optimal conditions for rice. Good time for top-dressing nitrogen at maximum tillering stage. Maintain 2–3 cm water level.",
            "hi": "धान के लिए अनुकूल स्थिति। अधिकतम कल्ले अवस्था में नाइट्रोजन टॉप-ड्रेसिंग का अच्छा समय।",
            "mr": "भातासाठी आदर्श परिस्थिती. जास्तीत जास्त फुटव्यांच्या अवस्थेत नायट्रोजन टॉप-ड्रेसिंगसाठी चांगला वेळ.",
        },
    },
}

# Generic fallback for unknown crops
GENERIC_TEMPLATES: dict[str, dict[str, str]] = {
    "rain_heavy": {
        "en": "Heavy rainfall expected. Ensure proper field drainage. Avoid irrigation and postpone chemical sprays.",
        "hi": "भारी वर्षा की संभावना। खेतों में उचित जल निकासी सुनिश्चित करें। सिंचाई और रासायनिक छिड़काव टालें।",
        "mr": "जड पाऊस अपेक्षित. शेतात योग्य निचरा सुनिश्चित करा. सिंचन आणि रासायनिक फवारणी टाळा.",
    },
    "rain_moderate": {
        "en": "Moderate rainfall expected. Good growing conditions. Monitor for pest and disease pressure.",
        "hi": "मध्यम वर्षा की संभावना। अच्छी वृद्धि की स्थिति। कीट और रोग दबाव की निगरानी करें।",
        "mr": "मध्यम पाऊस अपेक्षित. चांगली वाढीची परिस्थिती. कीड आणि रोगाच्या दबावाचे निरीक्षण करा.",
    },
    "dry_hot": {
        "en": "High temperature and dry conditions. Irrigate crops as required. Watch for heat stress and pest flare-ups.",
        "hi": "उच्च तापमान और शुष्क स्थिति। आवश्यकतानुसार सिंचाई करें। गर्मी के तनाव की निगरानी करें।",
        "mr": "उच्च तापमान आणि कोरडी परिस्थिती. आवश्यकतेनुसार पिकांना पाणी द्या. उष्णतेच्या ताणावर लक्ष ठेवा.",
    },
    "dry_mild": {
        "en": "Mild and dry weather. Suitable for field operations and sowing. Check soil moisture before irrigation.",
        "hi": "हल्का और शुष्क मौसम। कृषि कार्य और बुवाई के लिए उपयुक्त।",
        "mr": "सौम्य आणि कोरडे हवामान. शेत कामे आणि पेरणीसाठी योग्य.",
    },
    "humid_mild": {
        "en": "Humid and mild conditions. Monitor crops for fungal diseases. Avoid excessive irrigation.",
        "hi": "आर्द्र और हल्की स्थिति। फसलों में फंगल रोगों की निगरानी करें।",
        "mr": "दमट आणि सौम्य परिस्थिती. पिकांमधील बुरशीजन्य रोगांचे निरीक्षण करा.",
    },
    "optimal": {
        "en": "Optimal weather conditions. Continue regular crop management. Good time for fertilizer application.",
        "hi": "अनुकूल मौसम। नियमित फसल प्रबंधन जारी रखें। उर्वरक प्रयोग का अच्छा समय।",
        "mr": "आदर्श हवामान. नियमित पीक व्यवस्थापन सुरू ठेवा. खत वापरण्याचा चांगला वेळ.",
    },
}

IMD_FALLBACK: dict[str, str] = {
    "en": "Advisory based on official IMD forecast. Low ML confidence. Consult your local agricultural officer for crop-specific guidance.",
    "hi": "आधिकारिक IMD पूर्वानुमान पर आधारित सलाह। ML विश्वास कम है। फसल-विशिष्ट मार्गदर्शन के लिए अपने कृषि अधिकारी से संपर्क करें।",
    "mr": "अधिकृत IMD अंदाजावर आधारित सल्ला. ML आत्मविश्वास कमी आहे. पीक-विशिष्ट मार्गदर्शनासाठी आपल्या कृषी अधिकाऱ्याशी संपर्क साधा.",
}


# ---------------------------------------------------------------------------
# Weather Condition Classifier
# ---------------------------------------------------------------------------


def classify_weather_condition(weather: WeatherInput) -> tuple[str, float]:
    """
    Classify weather into one of 6 conditions and return a confidence score.

    Returns:
        (condition_key, confidence_score)
    """
    rain = weather.rainfall_mm
    temp_max = weather.temperature_max
    humidity = weather.humidity_pct
    confidence = 0.90  # Base confidence — degrades if data is partial

    if rain is None or temp_max is None or humidity is None:
        confidence = 0.50

    rain = rain or 0.0
    temp_max = temp_max or 30.0
    humidity = humidity or 60.0

    if rain > 30:
        condition = "rain_heavy"
        confidence = min(confidence, 0.88)
    elif rain > 8:
        condition = "rain_moderate"
        confidence = min(confidence, 0.85)
    elif temp_max > 38 and rain < 3:
        condition = "dry_hot"
        confidence = min(confidence, 0.87)
    elif humidity > 75 and temp_max < 32:
        condition = "humid_mild"
        confidence = min(confidence, 0.82)
    elif temp_max < 32 and rain < 5:
        condition = "dry_mild"
        confidence = min(confidence, 0.84)
    else:
        condition = "optimal"
        confidence = min(confidence, 0.83)

    return condition, confidence


# ---------------------------------------------------------------------------
# Advisory Generator
# ---------------------------------------------------------------------------


def generate_advisory(
    weather: WeatherInput,
    crop: str,
    ml_confidence_override: Optional[float] = None,
) -> AdvisoryOutput:
    """
    Generate a multilingual crop advisory from weather inputs.

    If confidence < MEDIUM_CONFIDENCE, returns IMD fallback text.
    """
    crop_lower = crop.lower().strip()
    condition, confidence = classify_weather_condition(weather)

    if ml_confidence_override is not None:
        confidence = ml_confidence_override

    is_imd_fallback = confidence < MEDIUM_CONFIDENCE

    # Pick template
    crop_templates = ADVISORY_TEMPLATES.get(crop_lower, None)
    if crop_templates:
        template = crop_templates.get(condition, crop_templates.get("optimal", {}))
    else:
        template = GENERIC_TEMPLATES.get(condition, GENERIC_TEMPLATES["optimal"])

    if is_imd_fallback:
        content_en = IMD_FALLBACK["en"]
        content_hi = IMD_FALLBACK["hi"]
        content_mr = IMD_FALLBACK["mr"]
    else:
        content_en = template.get("en", IMD_FALLBACK["en"])
        content_hi = template.get("hi", IMD_FALLBACK["hi"])
        content_mr = template.get("mr", IMD_FALLBACK["mr"])

    ml_explanation = {
        "condition_detected": condition,
        "rainfall_mm": weather.rainfall_mm,
        "temperature_max": weather.temperature_max,
        "humidity_pct": weather.humidity_pct,
        "wind_speed_kmh": weather.wind_speed_kmh,
        "confidence_basis": (
            "Template matched from weather thresholds" if not is_imd_fallback
            else "Low ML confidence — IMD fallback served"
        ),
    }

    weather_snapshot = {
        "temperature_max": weather.temperature_max,
        "temperature_min": weather.temperature_min,
        "rainfall_mm": weather.rainfall_mm,
        "humidity_pct": weather.humidity_pct,
        "wind_speed_kmh": weather.wind_speed_kmh,
        "cloud_cover_pct": weather.cloud_cover_pct,
    }

    return AdvisoryOutput(
        content_en=content_en,
        content_hi=content_hi,
        content_mr=content_mr,
        confidence_score=round(confidence, 3),
        is_imd_fallback=is_imd_fallback,
        ml_explanation=ml_explanation,
        weather_snapshot=weather_snapshot,
    )
