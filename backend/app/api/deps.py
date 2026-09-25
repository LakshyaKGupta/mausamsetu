"""Authentication and RBAC dependency injection helpers."""

from typing import Optional
from fastapi import Header, Query, HTTPException, status, Depends
from jose import jwt
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.db.session import get_db
from app.models.models import Officer, Farmer

ALGORITHM = "HS256"


class AuthContext(BaseModel):
    user_id: int
    role: str  # "farmer", "officer", "admin"
    name: str
    district: str = "Nagpur"
    block: Optional[str] = None


def get_auth_context(
    authorization: Optional[str] = Header(None),
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    x_officer_id: Optional[int] = Header(None, alias="X-Officer-Id"),
    officer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Extract caller identity & RBAC role from Bearer JWT, X-Demo-Role header, or query param.
    Supports seamless test execution and hackathon demo evaluation.
    """
    # 1. Direct role override via X-Demo-Role header (used in RBAC tests and demo toggles)
    if x_demo_role:
        role = x_demo_role.lower().strip()
        if role == "farmer":
            return AuthContext(
                user_id=1,
                role="farmer",
                name="Ramesh Patel",
                district="Nagpur",
                block="Kalmeshwar",
            )
        elif role == "admin":
            return AuthContext(
                user_id=999,
                role="admin",
                name="Dr. P. K. Deshmukh",
                district="Nagpur",
                block="District Operations HQ",
            )
        elif role == "officer":
            target_id = x_officer_id or officer_id or 1
            officer = db.query(Officer).filter(Officer.id == target_id).first()
            return AuthContext(
                user_id=target_id,
                role="officer",
                name=officer.name if officer else "Rajesh Sharma",
                district=officer.district if officer else "Nagpur",
                block=officer.block if officer else "Kalmeshwar",
            )

    # 2. Bearer JWT token parsing
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            role = payload.get("role", "farmer")
            user_id = int(payload.get("sub", 1))

            if role == "admin":
                return AuthContext(
                    user_id=user_id,
                    role="admin",
                    name="Dr. P. K. Deshmukh",
                    district="Nagpur",
                    block="District Operations HQ",
                )
            elif role == "officer":
                officer = db.query(Officer).filter(Officer.id == user_id).first()
                return AuthContext(
                    user_id=user_id,
                    role="officer",
                    name=officer.name if officer else "Rajesh Sharma",
                    district=officer.district if officer else "Nagpur",
                    block=officer.block if officer else "Kalmeshwar",
                )
            else:
                farmer = db.query(Farmer).filter(Farmer.id == user_id).first()
                return AuthContext(
                    user_id=user_id,
                    role="farmer",
                    name=farmer.name if farmer else "Ramesh Patel",
                    district="Nagpur",
                    block="Kalmeshwar",
                )
        except Exception:
            pass  # Fall through to default

    # 3. Default fallback for existing endpoints passing ?officer_id=...
    if officer_id:
        officer = db.query(Officer).filter(Officer.id == officer_id).first()
        return AuthContext(
            user_id=officer_id,
            role="officer",
            name=officer.name if officer else "Rajesh Sharma",
            district=officer.district if officer else "Nagpur",
            block=officer.block if officer else "Kalmeshwar",
        )

    # Default demo context is officer if not specified to maintain backward compatibility
    return AuthContext(
        user_id=1,
        role="officer",
        name="Rajesh Sharma",
        district="Nagpur",
        block="Kalmeshwar",
    )
