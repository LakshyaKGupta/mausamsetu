"""
Mock data seeder for MausamSetu development.

Seeds:
- 50 panchayats in Nagpur district, Maharashtra (including Kalmeshwar block)
- 5 officers
- 200 farmers
- Weather observations for all panchayats
- Advisories with guaranteed 2 pending advisories for Kalmeshwar Officer Console

Run: python -m app.utils.seeder
"""

import random
from datetime import datetime, timedelta

from app.db.session import SessionLocal, engine, Base
from app.models.models import (
    Panchayat,
    User,
    UserRole,
    OfficerProfile,
    FarmerProfile,
    FarmerCrop,
    WeatherObservation,
    Advisory,
    Approval,
    AdvisoryStatus,
    ApprovalAction,
    Language,
    WeatherSource,
)
from app.ml.advisory_generator import generate_advisory, WeatherInput

# ---------------------------------------------------------------------------
# Seed Data
# ---------------------------------------------------------------------------

NAGPUR_PANCHAYATS = [
    ("Dhapewada", "Kalmeshwar", 21.2820, 78.8950, 310),
    ("Kalmeshwar", "Kalmeshwar", 21.2353, 78.8617, 320),
    ("Bokhara", "Kalmeshwar", 21.2800, 78.9300, 330),
    ("Mohpa", "Kalmeshwar", 21.3200, 78.9000, 345),
    ("Ghoghali", "Kalmeshwar", 21.2400, 78.9100, 315),
    ("Kalamna", "Nagpur Rural", 21.1458, 79.0882, 315),
    ("Umred", "Umred", 20.8583, 79.3167, 290),
    ("Katol", "Katol", 21.2773, 78.5782, 350),
    ("Ramtek", "Ramtek", 21.3974, 79.3240, 410),
    ("Saoner", "Saoner", 21.3806, 78.9218, 295),
    ("Parseoni", "Parseoni", 21.5200, 79.1300, 330),
    ("Narkhed", "Narkhed", 21.4435, 78.5801, 360),
    ("Hingna", "Hingna", 21.0714, 78.9418, 300),
    ("Butibori", "Nagpur Rural", 21.0128, 79.0956, 310),
    ("Wadi", "Nagpur Rural", 21.0872, 79.1284, 295),
    ("Savner", "Saoner", 21.3987, 79.0693, 340),
    ("Kuhi", "Kuhi", 20.8790, 79.1350, 305),
    ("Bhiwapur", "Bhiwapur", 20.7626, 79.1913, 280),
    ("Mauda", "Mauda", 21.2082, 79.3150, 360),
    ("Kamptee", "Kamptee", 21.2214, 79.1978, 290),
    ("Kanhan", "Nagpur Rural", 21.2697, 79.0516, 295),
    ("Wardha Road", "Nagpur Rural", 21.0764, 79.0588, 305),
    ("Itwari", "Nagpur", 21.1522, 79.0976, 310),
    ("Tarsa", "Umred", 20.9000, 79.3500, 285),
    ("Mansar", "Ramtek", 21.3580, 79.2730, 420),
]

OFFICERS = [
    ("Rajesh Sharma", "9876543210", "Kalmeshwar"),
    ("Sunita Patil", "9876543211", "Hingna"),
    ("Anil Thakre", "9876543212", "Katol"),
    ("Pooja Raut", "9876543213", "Ramtek"),
    ("Vikas Deshmukh", "9876543214", "Saoner"),
]

CROPS = ["soybean", "cotton", "wheat", "orange", "chickpea"]

FARMER_NAMES = [
    "Ramesh Patel", "Suresh Kumar", "Santosh Rao", "Ganesh Joshi",
    "Dilip Deshmukh", "Vijay Gaikwad", "Prakash Shinde", "Anil More",
    "Nitin Kulkarni", "Sachin Wankhede", "Mahesh Chavan", "Sunil Pawar",
]


def seed_panchayats(db) -> list[Panchayat]:
    print("Seeding panchayats...")
    panchayats = []
    for name, block, lat, lng, elev in NAGPUR_PANCHAYATS:
        existing = db.query(Panchayat).filter(Panchayat.name == name, Panchayat.block == block).first()
        if not existing:
            p = Panchayat(
                name=name,
                block=block,
                district="Nagpur",
                state="Maharashtra",
                lat=lat,
                lng=lng,
                elevation_m=float(elev),
            )
            db.add(p)
            panchayats.append(p)
        else:
            panchayats.append(existing)
    db.commit()
    return db.query(Panchayat).all()


def seed_officers(db) -> list[OfficerProfile]:
    print("Seeding officers...")
    officers = []
    for name, phone, block in OFFICERS:
        existing_user = db.query(User).filter(User.phone == phone).first()
        if not existing_user:
            user = User(role=UserRole.officer, phone=phone, username=phone, is_active=True)
            db.add(user)
            db.flush()
            o = OfficerProfile(user_id=user.id, name=name, block=block, district="Nagpur")
            db.add(o)
            officers.append(o)
        else:
            officers.append(existing_user.officer_profile)
    db.commit()
    return db.query(OfficerProfile).all()


def seed_farmers(db, panchayats: list[Panchayat]) -> None:
    print("Seeding farmers...")
    for i in range(100):
        phone = f"98220{10000 + i}"
        existing = db.query(User).filter(User.phone == phone).first()
        if not existing:
            panchayat = panchayats[i % len(panchayats)]
            name = FARMER_NAMES[i % len(FARMER_NAMES)]
            crops = random.sample(CROPS, random.randint(1, 2))
            lang = random.choice([Language.hi, Language.mr, Language.en])
            user = User(role=UserRole.farmer, phone=phone, is_active=True)
            db.add(user)
            db.flush()
            f = FarmerProfile(
                user_id=user.id,
                panchayat_id=panchayat.id,
                name=f"{name} {i + 1}",
                preferred_language=lang,
                state="Maharashtra",
                district="Nagpur",
                block=panchayat.block,
                land_area_acres=round(random.uniform(2.0, 10.0), 1),
                onboarding_completed=True,
            )
            db.add(f)
            db.flush()
            for c in crops:
                db.add(FarmerCrop(
                    farmer_id=f.id,
                    crop_id=c,
                    variety="Standard",
                    crop_stage="Vegetative Growth",
                    area_acres=round(f.land_area_acres / len(crops), 1),
                ))
    db.commit()


def _get_seed_weather(p_id: int) -> tuple[WeatherInput, float]:
    scenarios = [
        WeatherInput(35.5, 24.0, 42.0, 85.0, 12.0, 90.0),   # rain_heavy
        WeatherInput(29.0, 20.0, 18.0, 72.0, 8.0, 55.0),    # rain_moderate
        WeatherInput(41.0, 28.0, 0.0, 30.0, 15.0, 10.0),    # dry_hot
        WeatherInput(28.0, 18.0, 2.0, 45.0, 10.0, 20.0),    # dry_mild
        WeatherInput(31.0, 22.0, 3.0, 80.0, 6.0, 65.0),     # humid_mild
        WeatherInput(30.0, 21.0, 8.0, 65.0, 10.0, 40.0),    # optimal
    ]
    confidences = [0.92, 0.88, 0.90, 0.85, 0.82, 0.94]
    base = p_id % len(scenarios)
    return scenarios[base], confidences[base]


def seed_weather(db, panchayats: list[Panchayat]) -> None:
    print("Seeding weather observations...")
    for p in panchayats:
        existing = db.query(WeatherObservation).filter(
            WeatherObservation.panchayat_id == p.id
        ).first()
        if not existing:
            weather_input, confidence = _get_seed_weather(p.id)
            obs = WeatherObservation(
                panchayat_id=p.id,
                observed_at=datetime.utcnow(),
                temperature_max=weather_input.temperature_max,
                temperature_min=weather_input.temperature_min,
                rainfall_mm=weather_input.rainfall_mm,
                humidity_pct=weather_input.humidity_pct,
                wind_speed_kmh=weather_input.wind_speed_kmh,
                cloud_cover_pct=weather_input.cloud_cover_pct,
                source=WeatherSource.mock,
                confidence_score=confidence,
            )
            db.add(obs)
    db.commit()


def seed_advisories(db, panchayats: list[Panchayat], officers: list[OfficerProfile]) -> None:
    print("Seeding advisories...")
    # Clean existing
    db.query(Approval).delete()
    db.query(Advisory).delete()
    db.commit()

    kalmeshwar_p = [p for p in panchayats if p.block.lower() == "kalmeshwar"]
    if not kalmeshwar_p:
        kalmeshwar_p = [panchayats[0], panchayats[1]]

    # MS-1042: Dhapewada, Soybean (Pending Review)
    adv1 = Advisory(
        id=1042,
        panchayat_id=kalmeshwar_p[0].id,
        crop="soybean",
        crop_stage="Vegetative Growth (वानस्पतिक वृद्धि • 32 दिन)",
        advisory_date=datetime.utcnow(),
        content_hi="आगामी 24 घंटे में 3.8 mm वर्षा का अनुमान है। काली मिट्टी में नमी पर्याप्त बनी रहेगी, अतः सिंचाई 24 घंटे के लिए स्थगित रखें।",
        content_mr="पुढील 24 तासांत 3.8 mm पावसाचा अंदाज आहे. जमिनीत ओलावा पुरेसा राहील, सिंचन 24 तास पुढे ढकलावे.",
        content_en="3.8 mm rainfall forecasted in next 24h. Soil moisture adequate, defer irrigation by 24 hours.",
        confidence_score=0.94,
        ml_explanation="MausamSetu XGBoost downscaling adjusted IMD block rainfall (4.5 mm) to 3.8 mm for Dhapewada microclimate. High reliability interval [3.2, 4.4 mm].",
        weather_snapshot={
            "temp_max": 32.0, "temp_min": 22.0, "rainfall_mm": 3.8, "humidity_pct": 72.0, "wind_speed_kmh": 12.0
        },
        baseline_rainfall_mm=4.5,
        predicted_rainfall_mm=3.8,
        model_diff_mm=-0.7,
        reliability_tier="HIGH",
        status=AdvisoryStatus.pending,
    )
    db.add(adv1)

    # MS-1043: Kalmeshwar, Cotton (Pending Review)
    adv2 = Advisory(
        id=1043,
        panchayat_id=kalmeshwar_p[1].id if len(kalmeshwar_p) > 1 else kalmeshwar_p[0].id,
        crop="cotton",
        crop_stage="Square Formation (कलियां बनना • 45 दिन)",
        advisory_date=datetime.utcnow(),
        content_hi="हवा में आर्द्रता 75% रहने से रस चूसक कीटों (एफिड्स व थ्रिप्स) की नियमित निगरानी करें। आर्थिक क्षति स्तर दिखने पर नीम तेल 5ml/L का छिड़काव करें।",
        content_mr="हवेतील आर्द्रता 75% असल्याने रसशोषक किडींचे निरीक्षण करावे. प्रादुर्भाव दिसल्यास निंबोळी अर्क 5ml/L फवारावे.",
        content_en="Relative humidity at 75%. Monitor for sucking pests (aphids/thrips). Apply neem oil 5ml/L if threshold exceeded.",
        confidence_score=0.88,
        ml_explanation="High morning humidity (75%) with calm winds (8 km/h) creates favorable conditions for sucking pests in flowering stage.",
        weather_snapshot={
            "temp_max": 33.5, "temp_min": 23.0, "rainfall_mm": 0.2, "humidity_pct": 75.0, "wind_speed_kmh": 8.0
        },
        baseline_rainfall_mm=0.0,
        predicted_rainfall_mm=0.2,
        model_diff_mm=0.2,
        reliability_tier="HIGH",
        status=AdvisoryStatus.pending,
    )
    db.add(adv2)
    db.commit()

    # Seed approved historical advisories for Kalmeshwar & other panchayats
    for i, p in enumerate(panchayats[2:]):
        crop = CROPS[i % len(CROPS)]
        crop_stage = "Vegetative"
        weather_input, confidence = _get_seed_weather(p.id)
        result = generate_advisory(weather_input, crop, ml_confidence_override=confidence)
        status = AdvisoryStatus.approved if i % 2 == 0 else AdvisoryStatus.sent
        officer = officers[i % len(officers)]
        adv_obj = Advisory(
            panchayat_id=p.id,
            officer_id=officer.id,
            crop=crop,
            crop_stage=crop_stage,
            advisory_date=datetime.utcnow() - timedelta(hours=(i + 1) * 4),
            content_en=result.content_en,
            content_hi=result.content_hi,
            content_mr=result.content_mr,
            confidence_score=result.confidence_score,
            ml_explanation=result.ml_explanation,
            weather_snapshot=result.weather_snapshot,
            is_imd_fallback=result.is_imd_fallback,
            baseline_rainfall_mm=3.0,
            predicted_rainfall_mm=2.5,
            model_diff_mm=-0.5,
            reliability_tier="HIGH",
            status=status,
            approved_at=datetime.utcnow() - timedelta(hours=(i + 1) * 3),
            sent_at=datetime.utcnow() - timedelta(hours=(i + 1) * 2) if status == AdvisoryStatus.sent else None,
        )
        db.add(adv_obj)
        db.flush()
        # Add approval record
        db.add(Approval(
            advisory_id=adv_obj.id,
            officer_id=officer.id,
            action=ApprovalAction.approved,
            note="Approved after field agromet evaluation and baseline variance check.",
            created_at=datetime.utcnow() - timedelta(hours=(i + 1) * 3),
        ))
    db.commit()
    print(f"Seeded {len(panchayats)} advisories with approvals successfully!")


def run_seed():
    print("=" * 50)
    print("MausamSetu — Seeding mock data")
    print("=" * 50)
    db = SessionLocal()
    try:
        panchayats = seed_panchayats(db)
        print(f"  ✅ {len(panchayats)} panchayats")
        officers = seed_officers(db)
        print(f"  ✅ {len(officers)} officers")
        seed_farmers(db, panchayats)
        print("  ✅ 100 farmers seeded")
        seed_weather(db, panchayats)
        print(f"  ✅ {len(panchayats)} weather observations")
        seed_advisories(db, panchayats, officers)
        print("  ✅ Advisories seeded with 2 pending for Kalmeshwar")
        print("=" * 50)
        print("Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
