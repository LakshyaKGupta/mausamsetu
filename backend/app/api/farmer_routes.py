from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from app.db.session import get_db, Base
from pydantic import BaseModel

router = APIRouter()

from app.models.models import FarmerCrop

class CropCreate(BaseModel):
    crop: str
    variety: str
    stage: str
    daysAfterSowing: int
    areaAcres: float

@router.get("/farmer/crops")
def get_farmer_crops(db: Session = Depends(get_db)):
    # Automatically create table if not exists
    FarmerCrop.metadata.create_all(bind=db.get_bind())
    
    crops = db.query(FarmerCrop).all()
    if not crops:
        # Seed initial crops
        seed_crops = [
            FarmerCrop(
                crop='सोयाबीन (Soybean)',
                variety='JS-335',
                stage='वानस्पतिक वृद्धि (Vegetative Stage)',
                days_after_sowing=32,
                area_acres=3.5,
                risk_rainfall='safe',
                risk_pest='warning',
                risk_temp='safe',
                advisory_text='अगले 24 घंटों में 3.8 mm वर्षा संभावित है। सिंचाई टालें और तना मक्खी (Stem fly) के प्रकोप हेतु खेत की निगरानी रखें।'
            ),
            FarmerCrop(
                crop='कपास (Cotton)',
                variety='Bt Cotton RCH-2',
                stage='कलियां बनना (Square Formation)',
                days_after_sowing=45,
                area_acres=2.0,
                risk_rainfall='safe',
                risk_pest='safe',
                risk_temp='safe',
                advisory_text='मिट्टी में पर्याप्त नमी है। फूल-कलियां बनते समय जलभराव न होने दें। जल निकासी नालियां खुली रखें।'
            ),
            FarmerCrop(
                crop='गेहूं (Wheat)',
                variety='GW-322',
                stage='बुवाई पूर्व तैयारी (Pre-Sowing)',
                days_after_sowing=0,
                area_acres=2.0,
                risk_rainfall='safe',
                risk_pest='safe',
                risk_temp='safe',
                advisory_text='आगामी रबी हेतु खेत जुताई करें और गोबर की खाद या कम्पोस्ट मिलाएँ। बीजोपचार आवश्यक है।'
            )
        ]
        db.add_all(seed_crops)
        db.commit()
        crops = db.query(FarmerCrop).all()
        
    out = []
    for c in crops:
        out.append({
            "id": f"crop-{c.id}",
            "crop": c.crop,
            "variety": c.variety,
            "stage": c.stage,
            "daysAfterSowing": c.days_after_sowing,
            "areaAcres": c.area_acres,
            "risks": {
                "rainfall": c.risk_rainfall,
                "pest": c.risk_pest,
                "temperature": c.risk_temp
            },
            "advisoryText": c.advisory_text,
            "officerApproved": c.officer_approved
        })
    return out

@router.post("/farmer/crops")
def add_farmer_crop(crop_data: CropCreate, db: Session = Depends(get_db)):
    new_crop = FarmerCrop(
        crop=crop_data.crop,
        variety=crop_data.variety,
        stage=crop_data.stage,
        days_after_sowing=crop_data.daysAfterSowing,
        area_acres=crop_data.areaAcres,
        advisory_text='नवीन फसल जोड़ी गई। कृषि अधिकारी द्वारा अगले चक्र में सलाह जारी की जाएगी।'
    )
    db.add(new_crop)
    db.commit()
    db.refresh(new_crop)
    
    return {
        "id": f"crop-{new_crop.id}",
        "crop": new_crop.crop,
        "variety": new_crop.variety,
        "stage": new_crop.stage,
        "daysAfterSowing": new_crop.days_after_sowing,
        "areaAcres": new_crop.area_acres,
        "risks": {
            "rainfall": new_crop.risk_rainfall,
            "pest": new_crop.risk_pest,
            "temperature": new_crop.risk_temp
        },
        "advisoryText": new_crop.advisory_text,
        "officerApproved": new_crop.officer_approved
    }

class ChatMessage(BaseModel):
    message: str
    language: str = "hi"
    panchayat_id: int = 1
    session_id: int = None
    farmer_id: int = None

@router.post("/chatbot/message")
def chat_message(msg: ChatMessage):
    reply = "नमस्ते! मैं वर्तमान में एक डेमो मोड में काम कर रहा हूँ। आपका प्रश्न था: " + msg.message
    if msg.language == 'en':
        reply = "Hello! I am currently running in a demo mode. Your query was: " + msg.message
    return {
        "reply": reply,
        "session_id": msg.session_id or 123
    }


@router.get("/farmer/mandi-prices")
def get_mandi_prices():
    return [
        {
            "crop": "सोयाबीन (Soybean)",
            "market": "नागपुर APMC (Nagpur)",
            "modal_price": 4650,
            "min_price": 4400,
            "max_price": 4820,
            "unit": "₹/क्विंटल",
            "trend": "up",
            "trend_pct": "+1.8%",
            "arrival_qty": "1,420 बोरी",
            "updated_at": "आज 11:30 AM"
        },
        {
            "crop": "कपास (Cotton)",
            "market": "कलमेश्वर उप-बाजार (Kalmeshwar)",
            "modal_price": 7420,
            "min_price": 7100,
            "max_price": 7650,
            "unit": "₹/क्विंटल",
            "trend": "up",
            "trend_pct": "+2.4%",
            "arrival_qty": "890 बोरी",
            "updated_at": "आज 11:00 AM"
        },
        {
            "crop": "नागपुर संतरा (Nagpur Orange)",
            "market": "कलमेश्वर मंडी (Kalmeshwar APMC)",
            "modal_price": 3800,
            "min_price": 3200,
            "max_price": 4200,
            "unit": "₹/क्विंटल",
            "trend": "stable",
            "trend_pct": "0.0%",
            "arrival_qty": "2,100 क्रेट",
            "updated_at": "आज 10:45 AM"
        },
        {
            "crop": "चना / हरभरा (Chickpea)",
            "market": "हिंगणा APMC (Hingna)",
            "modal_price": 5850,
            "min_price": 5600,
            "max_price": 6050,
            "unit": "₹/क्विंटल",
            "trend": "down",
            "trend_pct": "-0.5%",
            "arrival_qty": "540 बोरी",
            "updated_at": "आज 11:15 AM"
        },
        {
            "crop": "तूर / अरहर (Pigeon Pea)",
            "market": "काटोल APMC (Katol)",
            "modal_price": 10450,
            "min_price": 9900,
            "max_price": 10800,
            "unit": "₹/क्विंटल",
            "trend": "up",
            "trend_pct": "+3.1%",
            "arrival_qty": "320 बोरी",
            "updated_at": "आज 11:20 AM"
        }
    ]

