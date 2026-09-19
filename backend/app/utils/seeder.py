"""
Mock data seeder for MausamSetu development.

Seeds:
- 50 panchayats in Nagpur district, Maharashtra
- 5 officers
- 200 farmers
- Weather observations for all panchayats
- 50 advisories (mix of pending/approved/sent states)

Run: python -m app.utils.seeder
"""

import random
from datetime import datetime, timedelta

from app.db.session import SessionLocal, engine, Base
from app.models.models import (
    Panchayat,
    Officer,
    Farmer,
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
    ("Kalmeshwar", "Kalmeshwar", 21.2353, 78.8617, 320),
    ("Mohadi", "Savner", 21.5060, 79.0330, 285),
    ("Savner", "Savner", 21.3987, 79.0693, 340),
    ("Kuhi", "Kuhi", 20.8790, 79.1350, 305),
    ("Bhiwapur", "Bhiwapur", 20.7626, 79.1913, 280),
    ("Mauda", "Mauda", 21.2082, 79.3150, 360),
    ("Kamptee", "Kamptee", 21.2214, 79.1978, 290),
    ("Kanhan", "Nagpur Rural", 21.2697, 79.0516, 295),
    ("Wardha Road", "Nagpur Rural", 21.0764, 79.0588, 305),
    ("Itwari", "Nagpur", 21.1522, 79.0976, 310),
    ("Tarsa", "Umred", 20.9000, 79.3500, 285),
    ("Gondia Road", "Ramtek", 21.4500, 79.4000, 385),
    ("Bhandara Road", "Bhiwapur", 20.8000, 79.2500, 275),
    ("Lakhani", "Umred", 20.7200, 79.3800, 270),
    ("Ghugus", "Yavatmal", 20.0850, 78.7780, 395),
    ("Digdoh", "Nagpur Rural", 21.1800, 79.0700, 300),
    ("Godhni", "Umred", 20.9500, 79.2800, 280),
    ("Pipla", "Narkhed", 21.3800, 78.6200, 345),
    ("Mansar", "Ramtek", 21.3580, 79.2730, 420),
    ("Khapa", "Saoner", 21.3200, 78.9700, 310),
    ("Patur", "Katol", 21.2000, 78.5000, 370),
    ("Shelodi", "Parseoni", 21.5600, 79.1900, 315),
    ("Buti", "Nagpur Rural", 21.1000, 79.0600, 305),
    ("Bidgaon", "Hingna", 21.0300, 78.9000, 295),
    ("Koradi", "Nagpur Rural", 21.2500, 79.0000, 320),
    ("Bokhara", "Kalmeshwar", 21.2800, 78.9300, 330),
    ("Mohpa", "Savner", 21.4200, 79.0100, 345),
    ("Takli", "Nagpur Rural", 21.0400, 79.1100, 295),
    ("Nandori", "Kuhi", 20.8300, 79.1000, 290),
    ("Sukali", "Bhiwapur", 20.7900, 79.2000, 278),
    ("Jalalkheda", "Mauda", 21.1800, 79.3400, 355),
    ("Sonegaon", "Nagpur", 21.1200, 79.0300, 308),
    ("Amravati Road", "Nagpur Rural", 21.1000, 78.9500, 298),
    ("Pipri", "Kamptee", 21.2600, 79.2400, 285),
    ("Chamorshi", "Gadchiroli", 20.1000, 79.9200, 230),
    ("Nagpur Central", "Nagpur", 21.1458, 79.0882, 310),
    ("Wathoda", "Nagpur Rural", 21.0600, 79.0300, 295),
    ("Fetri", "Nagpur Rural", 21.0200, 79.0100, 290),
    ("Bela", "Nagpur Rural", 21.0000, 79.0000, 285),
    ("Yerkheda", "Nagpur Rural", 21.1600, 79.0800, 300),
]

OFFICERS = [
    ("Rajesh Sharma", "9876543210", "Nagpur Rural"),
    ("Priya Desai", "9876543211", "Umred"),
    ("Anil Wankhede", "9876543212", "Katol"),
    ("Sunita Bhatt", "9876543213", "Ramtek"),
    ("Mohan Thakre", "9876543214", "Savner"),
]

CROPS = ["wheat", "cotton", "soybean", "rice", "orange", "tur dal", "gram"]

FARMER_NAMES = [
    "Ramkrishna Yadav", "Sunita Bai", "Mohan Kale", "Priya Waghmare",
    "Arun Meshram", "Kanta Devi", "Vijay Bhangde", "Savita Ambhore",
    "Suresh Ingole", "Nalini Raut", "Prakash Fule", "Rekha Nandanwar",
    "Ganesh Chavhan", "Laxmi Bai", "Santosh Dhote", "Uma Devi",
    "Rajendra Tidke", "Poonam Bawane", "Dilip Hatwar", "Sharda Bai",
]


# ---------------------------------------------------------------------------
# Seed Functions
# ---------------------------------------------------------------------------


def seed_panchayats(db) -> list[Panchayat]:
    print("Seeding panchayats...")
    panchayats = []
    for name, block, lat, lng, elev in NAGPUR_PANCHAYATS:
        existing = db.query(Panchayat).filter(Panchayat.name == name).first()
        if not existing:
            p = Panchayat(name=name, block=block, district="Nagpur", state="Maharashtra",
                          lat=lat, lng=lng, elevation_m=float(elev))
            db.add(p)
            panchayats.append(p)
    db.commit()
    return db.query(Panchayat).all()


def seed_officers(db) -> list[Officer]:
    print("Seeding officers...")
    officers = []
    for name, phone, block in OFFICERS:
        existing = db.query(Officer).filter(Officer.phone == phone).first()
        if not existing:
            o = Officer(name=name, phone=phone, block=block, district="Nagpur")
            db.add(o)
            officers.append(o)
    db.commit()
    return db.query(Officer).all()


def seed_farmers(db, panchayats: list[Panchayat]) -> None:
    print("Seeding farmers...")
    for i in range(200):
        phone = f"70000{10000 + i}"
        existing = db.query(Farmer).filter(Farmer.phone == phone).first()
        if not existing:
            panchayat = panchayats[i % len(panchayats)]
            name = FARMER_NAMES[i % len(FARMER_NAMES)]
            crops = random.sample(CROPS, random.randint(1, 3))
            lang = random.choice([Language.hi, Language.mr, Language.en])
            f = Farmer(
                panchayat_id=panchayat.id,
                name=f"{name} {i + 1}",
                phone=phone,
                preferred_language=lang,
                crops=crops,
                land_area_acres=round(random.uniform(1.0, 15.0), 1),
            )
            db.add(f)
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


def seed_advisories(db, panchayats: list[Panchayat], officers: list[Officer]) -> None:
    print("Seeding advisories...")
    statuses = [AdvisoryStatus.pending, AdvisoryStatus.approved, AdvisoryStatus.sent]
    weights = [0.4, 0.3, 0.3]

    for i, p in enumerate(panchayats):
        crop = CROPS[i % len(CROPS)]
        weather_input, confidence = _get_seed_weather(p.id)
        result = generate_advisory(weather_input, crop, ml_confidence_override=confidence)

        status = random.choices(statuses, weights=weights)[0]
        officer = random.choice(officers)

        advisory_date = datetime.utcnow() - timedelta(hours=random.randint(0, 48))

        advisory = Advisory(
            panchayat_id=p.id,
            officer_id=officer.id if status != AdvisoryStatus.pending else None,
            crop=crop,
            advisory_date=advisory_date,
            content_en=result.content_en,
            content_hi=result.content_hi,
            content_mr=result.content_mr,
            confidence_score=result.confidence_score,
            ml_explanation=result.ml_explanation,
            weather_snapshot=result.weather_snapshot,
            is_imd_fallback=result.is_imd_fallback,
            status=status,
            approved_at=datetime.utcnow() if status in (AdvisoryStatus.approved, AdvisoryStatus.sent) else None,
            sent_at=datetime.utcnow() if status == AdvisoryStatus.sent else None,
        )
        db.add(advisory)

    db.commit()
    print(f"Seeded {len(panchayats)} advisories")


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
        print("  ✅ 200 farmers")
        seed_weather(db, panchayats)
        print(f"  ✅ {len(panchayats)} weather observations")
        seed_advisories(db, panchayats, officers)
        print("  ✅ Advisories seeded")
        print("=" * 50)
        print("Seeding complete!")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
