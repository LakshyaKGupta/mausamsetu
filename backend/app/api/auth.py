"""Auth router — OTP-based officer login."""

import hashlib
import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.models.models import Officer
from app.schemas.schemas import (
    MessageResponse,
    OfficerLoginRequest,
    OTPVerifyRequest,
    TokenResponse,
    OfficerOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _create_token(officer_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(officer_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def get_current_officer(
    token: str,
    db: Session = Depends(get_db),
) -> Officer:
    """Decode JWT and return officer. Used as a dependency."""
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        officer_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    officer = db.query(Officer).filter(Officer.id == officer_id, Officer.is_active == True).first()  # noqa: E712
    if not officer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Officer not found")
    return officer


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

    # In production: send via SMS. In dev: log to console.
    print(f"[DEV] OTP for {body.phone}: {otp}")  # noqa: T201

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

    # Clear OTP after use
    officer.hashed_otp = None
    officer.otp_expires_at = None
    db.commit()

    token = _create_token(officer.id)
    return TokenResponse(
        access_token=token,
        officer=OfficerOut.model_validate(officer),
    )
