"""Shared pytest fixtures and test database setup for MausamSetu backend."""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models.models import (
    Panchayat,
    User,
    UserRole,
    OfficerProfile,
    FarmerProfile,
    FarmerCrop,
    Advisory,
    AdvisoryStatus,
    Language,
    Approval,
    FieldReport,
    WeatherObservation,
    Officer,
    Farmer,
)

# Shared in-memory SQLite database across all test modules
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # 1. Seed Panchayats
    p1 = Panchayat(
        id=1,
        name="Dhapewada",
        block="Kalmeshwar",
        district="Nagpur",
        state="Maharashtra",
        lat=21.2435,
        lng=78.9123,
        elevation_m=312.0,
    )
    p2 = Panchayat(
        id=2,
        name="Seloo",
        block="Hingna",
        district="Nagpur",
        state="Maharashtra",
        lat=21.0500,
        lng=78.9600,
        elevation_m=298.0,
    )
    db.add_all([p1, p2])
    db.flush()

    # 2. Seed Officers
    u1 = User(id=1, role=UserRole.officer, phone="9876543210", username="9876543210", is_active=True)
    u2 = User(id=2, role=UserRole.officer, phone="9876543211", username="9876543211", is_active=True)
    db.add_all([u1, u2])
    db.flush()

    o1 = OfficerProfile(
        id=1,
        user_id=1,
        name="Rajesh Sharma",
        block="Kalmeshwar",
        district="Nagpur",
    )
    o2 = OfficerProfile(
        id=2,
        user_id=2,
        name="Sunita Patil",
        block="Hingna",
        district="Nagpur",
    )
    db.add_all([o1, o2])
    db.flush()

    # 3. Seed Farmer
    uf = User(id=3, role=UserRole.farmer, phone="9812345678", username="9812345678", is_active=True)
    db.add(uf)
    db.flush()

    f = FarmerProfile(
        id=1,
        user_id=3,
        name="Ramesh Patel",
        panchayat_id=1,
        preferred_language=Language.hi,
        district="Nagpur",
        block="Kalmeshwar",
        land_area_acres=4.0,
        onboarding_completed=True,
    )
    db.add(f)
    db.flush()
    db.add_all([
        FarmerCrop(farmer_id=1, crop_id="soybean", variety="Standard", crop_stage="Vegetative"),
        FarmerCrop(farmer_id=1, crop_id="cotton", variety="Standard", crop_stage="Flowering"),
    ])

    # 4. Seed Advisories
    a1 = Advisory(
        id=1,
        panchayat_id=1,
        crop="soybean",
        crop_stage="Vegetative Stage",
        advisory_date=datetime.now(),
        content_en="Hold irrigation for 24 hours.",
        content_hi="सिंचाई 24 घंटे टालें।",
        content_mr="सिंचन 24 तास पुढे ढकला.",
        confidence_score=0.92,
        baseline_rainfall_mm=4.5,
        predicted_rainfall_mm=3.8,
        model_diff_mm=-0.7,
        reliability_tier="HIGH",
        status=AdvisoryStatus.pending,
    )
    a2 = Advisory(
        id=2,
        panchayat_id=2,
        crop="cotton",
        crop_stage="Flowering Stage",
        advisory_date=datetime.now(),
        content_en="Apply spray for pest protection.",
        content_hi="कीट संरक्षण हेतु छिड़काव करें।",
        content_mr="कीड नियंत्रणासाठी फवारणी करा.",
        confidence_score=0.88,
        baseline_rainfall_mm=2.1,
        predicted_rainfall_mm=1.8,
        model_diff_mm=-0.3,
        reliability_tier="HIGH",
        status=AdvisoryStatus.pending,
    )
    db.add_all([a1, a2])

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
