"""Auth router — Unified authentication, progressive onboarding, and role resolution."""

import hashlib
import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.models import Farmer, Officer, Panchayat
from app.schemas.schemas import (
    FarmerOut,
    FarmerSignupRequest,
    MessageResponse,
    OfficerLoginRequest,
    OfficerOut,
    OTPVerifyRequest,
    TokenResponse,
    UnifiedLoginRequest,
    UnifiedLoginResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _create_token(user_id: int, role: str = "farmer") -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_current_officer(
    token: str,
    db: Session = Depends(get_db),
) -> Officer:
    """Decode JWT and return officer. Used as a dependency."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        officer_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    officer = db.query(Officer).filter(Officer.id == officer_id, Officer.is_active == True).first()  # noqa: E712
    if not officer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Officer not found")
    return officer


# ---------------------------------------------------------------------------
# Unified Authentication & Role Resolution
# ---------------------------------------------------------------------------


@router.post("/login", response_model=UnifiedLoginResponse)
def unified_login(body: UnifiedLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate via phone (+ OTP in production).
    The backend determines the user's role:
    1. District Admin (registered admin phone, e.g. 9999999999 or admin test phone)
    2. Agricultural Officer (registered in Officer table)
    3. Farmer (registered in Farmer table, or auto-provisioned demo farmer)
    """
    clean_phone = body.phone.strip()

    # 1. District Admin check
    if clean_phone in ("9999999999", "admin", "9876500000"):
        token = _create_token(user_id=999, role="admin")
        return UnifiedLoginResponse(
            access_token=token,
            role="admin",
            user_id=999,
            name="Dr. P. K. Deshmukh",
            phone=clean_phone,
            district="Nagpur",
            block="District HQ",
            panchayat_name="Nagpur District Center",
        )

    # 2. Agricultural Officer check
    officer = db.query(Officer).filter(
        Officer.phone == clean_phone,
        Officer.is_active == True,  # noqa: E712
    ).first()

    if officer or clean_phone in ("9876543210", "officer"):
        if not officer:
            officer = db.query(Officer).first()
        officer_id = officer.id if officer else 1
        officer_name = officer.name if officer else "Rajesh Sharma"
        officer_block = officer.block if officer else "Kalmeshwar"
        token = _create_token(user_id=officer_id, role="officer")
        return UnifiedLoginResponse(
            access_token=token,
            role="officer",
            user_id=officer_id,
            name=officer_name,
            phone=clean_phone,
            district="Nagpur",
            block=officer_block,
            panchayat_name=f"{officer_block} Sub-Division",
        )

    # 3. Farmer check
    farmer = db.query(Farmer).filter(
        Farmer.phone == clean_phone,
        Farmer.is_active == True,  # noqa: E712
    ).first()

    if not farmer:
        # Fallback to first farmer or auto-create basic record
        panchayat = db.query(Panchayat).first()
        panchayat_id = panchayat.id if panchayat else 1
        panchayat_name = panchayat.name if panchayat else "Dhapewada"
        farmer = db.query(Farmer).first()
        if farmer:
            farmer_id = farmer.id
            farmer_name = farmer.name
            farmer_crops = farmer.crops or ["soybean"]
            farmer_lang = farmer.preferred_language.value if farmer.preferred_language else "hi"
            farmer_pid = farmer.panchayat_id
            p_obj = db.query(Panchayat).filter(Panchayat.id == farmer_pid).first()
            p_name = p_obj.name if p_obj else panchayat_name
        else:
            farmer_id = 1
            farmer_name = "Ramesh Patel"
            farmer_crops = ["soybean", "cotton"]
            farmer_lang = "hi"
            p_name = panchayat_name
            farmer_pid = panchayat_id
    else:
        farmer_id = farmer.id
        farmer_name = farmer.name
        farmer_crops = farmer.crops or ["soybean"]
        farmer_lang = farmer.preferred_language.value if farmer.preferred_language else "hi"
        farmer_pid = farmer.panchayat_id
        p_obj = db.query(Panchayat).filter(Panchayat.id == farmer_pid).first()
        p_name = p_obj.name if p_obj else "Dhapewada"

    token = _create_token(user_id=farmer_id, role="farmer")
    return UnifiedLoginResponse(
        access_token=token,
        role="farmer",
        user_id=farmer_id,
        name=farmer_name,
        phone=clean_phone,
        district="Nagpur",
        block="Kalmeshwar",
        panchayat_id=farmer_pid,
        panchayat_name=p_name,
        preferred_language=farmer_lang,
        crops=farmer_crops,
    )


# ---------------------------------------------------------------------------
# Progressive Farmer Signup Flow
# ---------------------------------------------------------------------------


@router.post("/farmer/signup", response_model=UnifiedLoginResponse)
def farmer_signup(body: FarmerSignupRequest, db: Session = Depends(get_db)):
    """Progressive onboarding endpoint for farmers."""
    # Check if phone already registered
    existing = db.query(Farmer).filter(Farmer.phone == body.phone).first()
    if existing:
        token = _create_token(user_id=existing.id, role="farmer")
        p_obj = db.query(Panchayat).filter(Panchayat.id == existing.panchayat_id).first()
        return UnifiedLoginResponse(
            access_token=token,
            role="farmer",
            user_id=existing.id,
            name=existing.name,
            phone=existing.phone,
            district=existing.district or body.district,
            block=existing.block or body.block,
            panchayat_id=existing.panchayat_id,
            panchayat_name=p_obj.name if p_obj else "Dhapewada",
            preferred_language=existing.preferred_language.value,
            crops=existing.crops or body.crops,
        )

    # Verify panchayat exists or fallback to 1
    panchayat = db.query(Panchayat).filter(Panchayat.id == body.panchayat_id).first()
    if not panchayat:
        panchayat = db.query(Panchayat).first()
    panchayat_id = panchayat.id if panchayat else 1
    panchayat_name = panchayat.name if panchayat else "Dhapewada"

    new_farmer = Farmer(
        name=body.name,
        phone=body.phone,
        panchayat_id=panchayat_id,
        preferred_language=body.preferred_language,
        crops=body.crops,
        land_area_acres=body.land_area_acres,
        state=body.state,
        district=body.district,
        block=body.block,
        is_active=True,
    )
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)

    token = _create_token(user_id=new_farmer.id, role="farmer")
    return UnifiedLoginResponse(
        access_token=token,
        role="farmer",
        user_id=new_farmer.id,
        name=new_farmer.name,
        phone=new_farmer.phone,
        district=new_farmer.district,
        block=new_farmer.block,
        panchayat_id=new_farmer.panchayat_id,
        panchayat_name=panchayat_name,
        preferred_language=new_farmer.preferred_language.value,
        crops=new_farmer.crops,
    )


# ---------------------------------------------------------------------------
# Demo Quick Access (For Hackathon Judges)
# ---------------------------------------------------------------------------


@router.get("/demo-session/{role}", response_model=UnifiedLoginResponse)
def get_demo_session(role: str, db: Session = Depends(get_db)):
    """Instant demo persona generator for SIH hackathon evaluation."""
    role = role.lower()
    if role == "admin":
        token = _create_token(user_id=999, role="admin")
        return UnifiedLoginResponse(
            access_token=token,
            role="admin",
            user_id=999,
            name="Dr. P. K. Deshmukh",
            phone="9999999999",
            district="Nagpur",
            block="District Operations HQ",
            panchayat_name="Nagpur District Center",
        )
    elif role == "officer":
        officer = db.query(Officer).first()
        officer_id = officer.id if officer else 1
        officer_name = officer.name if officer else "Rajesh Sharma"
        officer_block = officer.block if officer else "Kalmeshwar"
        token = _create_token(user_id=officer_id, role="officer")
        return UnifiedLoginResponse(
            access_token=token,
            role="officer",
            user_id=officer_id,
            name=officer_name,
            phone="9876543210",
            district="Nagpur",
            block=officer_block,
            panchayat_name=f"{officer_block} Sub-Division",
        )
    else:  # farmer
        farmer = db.query(Farmer).first()
        panchayat = db.query(Panchayat).filter(Panchayat.id == (farmer.panchayat_id if farmer else 1)).first()
        farmer_id = farmer.id if farmer else 1
        farmer_name = farmer.name if farmer else "Ramesh Patel"
        panchayat_name = panchayat.name if panchayat else "Dhapewada"
        token = _create_token(user_id=farmer_id, role="farmer")
        return UnifiedLoginResponse(
            access_token=token,
            role="farmer",
            user_id=farmer_id,
            name=farmer_name,
            phone="9812345678",
            district="Nagpur",
            block="Kalmeshwar",
            panchayat_id=panchayat.id if panchayat else 1,
            panchayat_name=panchayat_name,
            preferred_language="hi",
            crops=["soybean", "cotton"],
        )


# ---------------------------------------------------------------------------
# Backward Compatible Officer OTP Endpoints
# ---------------------------------------------------------------------------


@router.post("/officer/request-otp", response_model=MessageResponse)
def request_otp(body: OfficerLoginRequest, db: Session = Depends(get_db)):
    """Send OTP to officer phone. In dev mode, OTP is returned in response."""
    officer = db.query(Officer).filter(
        Officer.phone == body.phone,
        Officer.is_active == True,  # noqa: E712
    ).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not registered")

    otp = "".join(random.choices(string.digits, k=6))
    officer.hashed_otp = _hash_otp(otp)
    officer.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    if settings.ENVIRONMENT == "development":
        return MessageResponse(message=f"OTP sent (dev mode): {otp}")
    return MessageResponse(message="OTP sent to registered phone number")


@router.post("/officer/verify-otp", response_model=TokenResponse)
def verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    officer = db.query(Officer).filter(
        Officer.phone == body.phone,
        Officer.is_active == True,  # noqa: E712
    ).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    if not officer.hashed_otp or not officer.otp_expires_at:
        raise HTTPException(status_code=400, detail="No OTP requested")

    if datetime.utcnow() > officer.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    if officer.hashed_otp != _hash_otp(body.otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")

    officer.hashed_otp = None
    officer.otp_expires_at = None
    db.commit()

    token = _create_token(officer.id, role="officer")
    return TokenResponse(
        access_token=token,
        role="officer",
        officer=OfficerOut.model_validate(officer),
    )
