"""Chatbot API router — controlled retrieval, no hallucination."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Advisory, AdvisoryStatus, ChatbotSession, Language, Panchayat
from app.schemas.schemas import ChatbotRequest, ChatbotResponse

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


# ---------------------------------------------------------------------------
# Keyword matching for intent detection
# ---------------------------------------------------------------------------

WEATHER_KEYWORDS = {
    Language.hi: ["मौसम", "बारिश", "तापमान", "गर्मी", "ठंड", "हवा", "बादल"],
    Language.en: ["weather", "rain", "temperature", "hot", "cold", "wind", "cloud", "forecast"],
    Language.mr: ["हवामान", "पाऊस", "तापमान", "उष्णता", "थंडी", "वारा", "ढग"],
}

ADVISORY_KEYWORDS = {
    Language.hi: ["सलाह", "फसल", "खेती", "सिंचाई", "उर्वरक", "कीट", "रोग", "बुवाई"],
    Language.en: ["advisory", "crop", "farm", "irrigation", "fertilizer", "pest", "disease", "sow", "plant"],
    Language.mr: ["सल्ला", "पीक", "शेती", "सिंचन", "खत", "कीड", "रोग", "पेरणी"],
}

FALLBACK_RESPONSES = {
    Language.hi: "मुझे इस प्रश्न का उत्तर उपलब्ध जानकारी से नहीं मिला। कृपया अपने स्थानीय कृषि अधिकारी से संपर्क करें।",
    Language.en: "I couldn't find information to answer this question. Please contact your local agricultural officer for help.",
    Language.mr: "मला या प्रश्नाचे उत्तर उपलब्ध माहितीमधून मिळाले नाही. कृपया आपल्या स्थानिक कृषी अधिकाऱ्याशी संपर्क साधा.",
}

GREETING_RESPONSES = {
    Language.hi: "नमस्ते! मैं मौसमसेतु का AI सहायक हूं। मैं आपको मौसम और फसल सलाह के बारे में जानकारी दे सकता हूं।",
    Language.en: "Hello! I am MausamSetu's AI assistant. I can help you with weather forecasts and crop advisories.",
    Language.mr: "नमस्ते! मी मौसमसेतुचा AI सहायक आहे. मी तुम्हाला हवामान आणि पीक सल्ल्याबद्दल माहिती देऊ शकतो.",
}


def _detect_intent(message: str, language: Language) -> str:
    msg_lower = message.lower()
    greetings = ["नमस्ते", "हेलो", "हाय", "hello", "hi", "नमस्कार"]
    if any(g in msg_lower for g in greetings):
        return "greeting"

    weather_kw = WEATHER_KEYWORDS.get(language, WEATHER_KEYWORDS[Language.en])
    if any(k in msg_lower for k in weather_kw):
        return "weather"

    advisory_kw = ADVISORY_KEYWORDS.get(language, ADVISORY_KEYWORDS[Language.en])
    if any(k in msg_lower for k in advisory_kw):
        return "advisory"

    return "fallback"


def _get_advisory_reply(panchayat_id: int, language: Language, db: Session) -> tuple[str, str]:
    """Fetch latest approved advisory and return relevant content."""
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
            Language.hi: "आपके क्षेत्र के लिए अभी कोई अनुमोदित सलाह उपलब्ध नहीं है।",
            Language.en: "No approved advisory is available for your area yet.",
            Language.mr: "तुमच्या क्षेत्रासाठी अद्याप कोणताही मंजूर सल्ला उपलब्ध नाही.",
        }
        return no_advisory.get(language, no_advisory[Language.en]), "advisory"

    content_map = {
        Language.hi: latest.content_hi,
        Language.en: latest.content_en,
        Language.mr: latest.content_mr or latest.content_hi,
    }
    return content_map.get(language, latest.content_en), "advisory"


def _get_weather_reply(panchayat_id: int, language: Language, db: Session) -> tuple[str, str]:
    from app.models.models import WeatherObservation
    from datetime import date

    today = date.today()
    obs = (
        db.query(WeatherObservation)
        .filter(
            WeatherObservation.panchayat_id == panchayat_id,
            WeatherObservation.observed_at >= datetime(today.year, today.month, today.day),
        )
        .first()
    )

    if not obs:
        no_weather = {
            Language.hi: "आज के मौसम का डेटा अभी उपलब्ध नहीं है।",
            Language.en: "Today's weather data is not available yet.",
            Language.mr: "आजचा हवामान डेटा अद्याप उपलब्ध नाही.",
        }
        return no_weather.get(language, no_weather[Language.en]), "weather"

    if language == Language.hi:
        reply = (
            f"आज का मौसम: अधिकतम तापमान {obs.temperature_max}°C, "
            f"न्यूनतम {obs.temperature_min}°C, "
            f"वर्षा {obs.rainfall_mm} मिमी, "
            f"आर्द्रता {obs.humidity_pct}%।"
        )
    elif language == Language.mr:
        reply = (
            f"आजचे हवामान: कमाल तापमान {obs.temperature_max}°C, "
            f"किमान {obs.temperature_min}°C, "
            f"पाऊस {obs.rainfall_mm} मिमी, "
            f"आर्द्रता {obs.humidity_pct}%."
        )
    else:
        reply = (
            f"Today's weather: Max {obs.temperature_max}°C, "
            f"Min {obs.temperature_min}°C, "
            f"Rainfall {obs.rainfall_mm} mm, "
            f"Humidity {obs.humidity_pct}%."
        )

    return reply, "weather"


@router.post("/message", response_model=ChatbotResponse)
def send_message(body: ChatbotRequest, db: Session = Depends(get_db)):
    """Process a farmer chatbot message and return a grounded reply."""
    intent = _detect_intent(body.message, body.language)
    panchayat_id = body.panchayat_id or 1  # Default to first panchayat if not provided

    if intent == "greeting":
        reply = GREETING_RESPONSES.get(body.language, GREETING_RESPONSES[Language.en])
        source = "greeting"
    elif intent == "weather":
        reply, source = _get_weather_reply(panchayat_id, body.language, db)
    elif intent == "advisory":
        reply, source = _get_advisory_reply(panchayat_id, body.language, db)
    else:
        reply = FALLBACK_RESPONSES.get(body.language, FALLBACK_RESPONSES[Language.en])
        source = "fallback"

    # Save/update session
    session = None
    if body.session_id:
        session = db.query(ChatbotSession).filter(ChatbotSession.id == body.session_id).first()

    if not session:
        session = ChatbotSession(
            farmer_id=body.farmer_id,
            panchayat_id=panchayat_id,
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
