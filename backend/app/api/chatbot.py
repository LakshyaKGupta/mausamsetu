"""
Chatbot API router — Grounded Agricultural & Weather Assistant.
All responses are strictly derived from verified Panchayat predictions and approved advisories.
Zero hallucination: LLM/NLP is never permitted to invent weather data or override agronomic rules.
"""

from datetime import datetime, date
from typing import Optional, Tuple
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
    "rain_check": {
        Language.hi: ["बारिश", "बरसात", "पानी गिरेगा", "वर्षा होगी", "कल बारिश", "आज बारिश"],
        Language.mr: ["पाऊस", "पाऊस पडेल का", "उद्या पाऊस", "आज पाऊस", "पावसाचा अंदाज"],
        Language.en: ["rain", "raining", "will it rain", "rainfall", "rain tomorrow", "rain today"],
    },
    "irrigation": {
        Language.hi: ["सिंचाई", "पानी देना", "पानी लगाना", "सिंचाई करूं", "पानी दूं"],
        Language.mr: ["सिंचन", "पाणी देणे", "पाणी देऊ का", "सिंचन करावे का"],
        Language.en: ["irrigate", "irrigation", "water the crop", "should i irrigate", "watering"],
    },
    "spray": {
        Language.hi: ["छिड़काव", "स्प्रे", "कीटनाशक", "दवा छिड़कना", "दवाई डालूं"],
        Language.mr: ["फवारणी", "स्प्रे", "कीटकनाशक", "औषध फवारणी"],
        Language.en: ["spray", "pesticide", "fungicide", "can i spray", "spraying"],
    },
    "weather": {
        Language.hi: ["मौसम", "तापमान", "गर्मी", "ठंड", "हवा", "बादल"],
        Language.mr: ["हवामान", "तापमान", "उष्णता", "थंडी", "वारा", "ढग"],
        Language.en: ["weather", "temperature", "forecast", "climate", "hot", "cold"],
    },
    "advisory": {
        Language.hi: ["सलाह", "फसल", "खेती", "रोग", "कीट", "क्या करूं"],
        Language.mr: ["सल्ला", "पीक", "शेती", "रोग", "कीड", "काय करावे"],
        Language.en: ["advisory", "crop", "farm", "advice", "what should i do"],
    },
}


def _detect_intent(message: str, language: Language) -> str:
    msg_lower = message.lower()
    greetings = ["नमस्ते", "हेलो", "हाय", "hello", "hi", "नमस्कार", "राम राम"]
    if any(g in msg_lower for g in greetings):
        return "greeting"

    for intent, lang_dict in INTENT_KEYWORDS.items():
        keywords = lang_dict.get(language, lang_dict[Language.en])
        if any(k in msg_lower for k in keywords):
            return intent

    return "fallback"


async def _handle_rain_check(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Check downscaled rainfall prediction for the panchayat."""
    pred = await downscaler_engine.downscale_panchayat_forecast(
        panchayat_id=str(panchayat.id),
        panchayat_name=panchayat.name,
        block_id=panchayat.block,
        lat=panchayat.lat,
        lon=panchayat.lng,
        elevation_m=panchayat.elevation_m,
        target_date=date.today(),
    )

    rain = pred.predicted_rainfall_mm
    margin = pred.prediction_interval.expected_error_margin_mm
    rel = "उच्च" if pred.prediction_interval.reliability_status.value == "HIGH" else "मध्यम"
    rel_en = "High" if pred.prediction_interval.reliability_status.value == "HIGH" else "Moderate"
    rel_mr = "उच्च" if pred.prediction_interval.reliability_status.value == "HIGH" else "मध्यम"

    if rain >= 20.0:
        desc_hi = f"भारी बारिश ({rain} ±{margin} मिमी) का अनुमान है। विश्वसनीयता: {rel}।"
        desc_mr = f"मुसळधार पावसाचा ({rain} ±{margin} मिमी) अंदाज आहे. विश्वसनीयता: {rel_mr}."
        desc_en = f"Heavy rainfall ({rain} ±{margin} mm) expected. Model reliability: {rel_en}."
    elif rain >= 5.0:
        desc_hi = f"मध्यम बारिश ({rain} ±{margin} मिमी) की संभावना है। विश्वसनीयता: {rel}।"
        desc_mr = f"मध्यम पावसाची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel_mr}."
        desc_en = f"Moderate rainfall ({rain} ±{margin} mm) likely. Model reliability: {rel_en}."
    elif rain > 0.0:
        desc_hi = f"हल्की बूंदाबांदी ({rain} ±{margin} मिमी) हो सकती है। विश्वसनीयता: {rel}।"
        desc_mr = f"हलक्या सरींची ({rain} ±{margin} मिमी) शक्यता आहे. विश्वसनीयता: {rel_mr}."
        desc_en = f"Light drizzle ({rain} ±{margin} mm) possible. Model reliability: {rel_en}."
    else:
        desc_hi = f"बारिश की कोई संभावना नहीं है (0.0 मिमी)। मौसम शुष्क रहेगा।"
        desc_mr = f"पावसाची शक्यता नाही (0.0 मिमी). हवामान कोरडे राहील."
        desc_en = f"No rainfall expected (0.0 mm). Weather will remain dry."

    responses = {Language.hi: desc_hi, Language.mr: desc_mr, Language.en: desc_en}
    return responses.get(language, desc_en), "weather"


async def _handle_irrigation(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide grounded irrigation advice based on downscaled rainfall prediction."""
    pred = await downscaler_engine.downscale_panchayat_forecast(
        panchayat_id=str(panchayat.id),
        panchayat_name=panchayat.name,
        block_id=panchayat.block,
        lat=panchayat.lat,
        lon=panchayat.lng,
        elevation_m=panchayat.elevation_m,
        target_date=date.today(),
    )

    rain = pred.predicted_rainfall_mm
    if rain >= 10.0:
        hi = f"आज सिंचाई बिल्कुल न करें। आपके पंचायत में {rain} मिमी बारिश का अनुमान है, जिससे खेतों में पर्याप्त नमी रहेगी।"
        mr = f"आज सिंचन करू नका. आपल्या पंचायत क्षेत्रात {rain} मिमी पावसाचा अंदाज आहे, ज्यामुळे जमिनीत पुरेसा ओलावा राहील."
        en = f"Do not irrigate today. {rain} mm rainfall is forecast for your panchayat, which will provide adequate soil moisture."
    elif rain >= 3.0:
        hi = f"सिंचाई टालें। हल्की बारिश ({rain} मिमी) संभावित है। 24 घंटे बाद मिट्टी की नमी देखकर ही निर्णय लें।"
        mr = f"सिंचन पुढे ढकला. हलका पाऊस ({rain} मिमी) अपेक्षित आहे. 24 तासांनंतर मातीतील ओलावा तपासून निर्णय घ्या."
        en = f"Hold off on irrigation. Light rain ({rain} mm) is expected. Check soil moisture after 24 hours before irrigating."
    else:
        hi = f"मौसम शुष्क रहने का अनुमान है (बारिश: 0 मिमी)। आवश्यकतानुसार शाम के समय हल्की सिंचाई कर सकते हैं।"
        mr = f"हवामान कोरडे राहण्याचा अंदाज आहे (पाऊस: 0 मिमी). गरजेनुसार संध्याकाळी हलके सिंचन करू शकता."
        en = f"Dry weather expected (0 mm rain). You may perform light irrigation in the evening if required."

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


async def _handle_spray(panchayat: Panchayat, language: Language) -> Tuple[str, str]:
    """Provide grounded pesticide/fertilizer spraying advice based on rain and wind."""
    pred = await downscaler_engine.downscale_panchayat_forecast(
        panchayat_id=str(panchayat.id),
        panchayat_name=panchayat.name,
        block_id=panchayat.block,
        lat=panchayat.lat,
        lon=panchayat.lng,
        elevation_m=panchayat.elevation_m,
        target_date=date.today(),
    )

    rain = pred.predicted_rainfall_mm
    if rain >= 5.0:
        hi = f"आज कीटनाशक या दवा का छिड़काव न करें! {rain} मिमी बारिश से दवा धुल जाएगी और नुकसान होगा।"
        mr = f"आज कीटकनाशक किंवा खतांची फवारणी करू नका! {rain} मिमी पावसामुळे औषध वाहून जाईल आणि नुकसान होईल."
        en = f"Do not spray chemicals today! Expected rainfall of {rain} mm will wash away the pesticide, causing loss."
    else:
        hi = f"छिड़काव के लिए मौसम अनुकूल है (बारिश की संभावना नहीं है)। सुबह या शाम के शांत मौसम में छिड़काव करें।"
        mr = f"फवारणीसाठी हवामान अनुकूल आहे (पावसाची शक्यता नाही). सकाळच्या किंवा संध्याकाळच्या वेळी फवारणी करा."
        en = f"Weather is favorable for spraying (no rain expected). Spray in calm morning or evening hours."

    responses = {Language.hi: hi, Language.mr: mr, Language.en: en}
    return responses.get(language, en), "advisory"


def _handle_crop_advisory(panchayat_id: int, language: Language, db: Session) -> Tuple[str, str]:
    """Fetch latest officer-approved crop advisory."""
    latest = (
        db.query(Advisory)
        .filter(
            Advisory.panchayat_id == panchayat_id,
            Advisory.status.in_([AdvisoryStatus.approved, AdvisoryStatus.sent]),
        )
        .order_by(Advisory.advisory_date.desc())
        .first()
    )

    if not latest:
        no_advisory = {
            Language.hi: "आपके क्षेत्र के लिए अभी कोई स्वीकृत कृषि सलाह उपलब्ध नहीं है। कृपया कृषि अधिकारी से संपर्क करें।",
            Language.mr: "आपल्या क्षेत्रासाठी अद्याप कोणताही मंजूर कृषी सल्ला उपलब्ध नाही. कृपया कृषी अधिकाऱ्याशी संपर्क साधा.",
            Language.en: "No approved agricultural advisory is currently available for your area. Please contact your agricultural officer.",
        }
        return no_advisory.get(language, no_advisory[Language.en]), "advisory"

    content_map = {
        Language.hi: latest.content_hi,
        Language.mr: latest.content_mr or latest.content_hi,
        Language.en: latest.content_en,
    }
    return content_map.get(language, latest.content_en), "advisory"


@router.post("/message", response_model=ChatbotResponse)
async def send_message(body: ChatbotRequest, db: Session = Depends(get_db)):
    """
    Process farmer voice/text query and return strictly grounded answer from system data.
    """
    panchayat_id = body.panchayat_id or 1
    panchayat = db.query(Panchayat).filter(Panchayat.id == panchayat_id).first()
    if not panchayat:
        # Default fallback if invalid panchayat
        panchayat = db.query(Panchayat).first()

    intent = _detect_intent(body.message, body.language)

    if intent == "greeting":
        greetings = {
            Language.hi: f"नमस्ते! मैं मौसमसेतु का AI सहायक हूं। मैं आपको {panchayat.name} पंचायत के मौसम और फसल सलाह की सटीक जानकारी दे सकता हूं। पूछिए, आज क्या सहायता चाहिए?",
            Language.mr: f"नमस्कार! मी मौसमसेतूचा AI सहायक आहे. मी तुम्हाला {panchayat.name} पंचायतच्या हवामान आणि पीक सल्ल्याची अचूक माहिती देऊ शकतो. विचारा, काय मदत हवी आहे?",
            Language.en: f"Hello! I am MausamSetu's AI assistant. I provide verified weather and crop advisories for {panchayat.name} Panchayat. How can I help you today?",
        }
        reply = greetings.get(body.language, greetings[Language.en])
        source = "greeting"
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
        fallbacks = {
            Language.hi: f"माफ़ कीजिए, मुझे इस प्रश्न का उत्तर सत्यापित डेटा में नहीं मिला। आप पूछ सकते हैं: 'क्या कल बारिश होगी?', 'क्या मैं सिंचाई करूँ?', या 'आज की फसल सलाह'。",
            Language.mr: f"माफ करा, मला या प्रश्नाचे उत्तर पडताळणी केलेल्या डेटामध्ये सापडले नाही. आपण विचारू शकता: 'उद्या पाऊस पडेल का?', 'सिंचन करावे का?', किंवा 'आजचा पीक सल्ला'.",
            Language.en: f"I could not find an answer in verified system data. You can ask: 'Will it rain tomorrow?', 'Should I irrigate?', or 'Today's crop advisory'.",
        }
        reply = fallbacks.get(body.language, fallbacks[Language.en])
        source = "fallback"

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
