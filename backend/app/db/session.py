import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Check if SQLite or PostgreSQL
if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    try:
        # Test PostgreSQL connection with pre-ping
        test_engine = create_engine(db_url, pool_pre_ping=True)
        with test_engine.connect():
            pass
        engine = test_engine
        logger.info("Connected to PostgreSQL database.")
    except Exception as e:
        logger.warning(
            f"PostgreSQL connection to {db_url.split('@')[-1] if '@' in db_url else db_url} failed ({e}). "
            "Falling back to SQLite database for continuous service availability."
        )
        sqlite_path = os.path.join(os.path.dirname(__file__), "../../mausamsetu.db")
        engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db_and_seed():
    """Ensure database tables exist and default seed data is populated on application startup."""
    try:
        from app.models.models import (
            Base as ModelsBase,
            User,
            UserRole,
            FarmerProfile,
            OfficerProfile,
            AdminProfile,
            FarmerCrop,
            Panchayat,
            Language,
        )
        from app.database.base import Base as DbBase
        from app.api.auth import get_password_hash

        # Create all tables safely
        ModelsBase.metadata.create_all(bind=engine)
        DbBase.metadata.create_all(bind=engine)

        db = SessionLocal()
        try:
            # Check if panchayats exist; if not, seed foundational panchayats
            if db.query(Panchayat).count() == 0:
                logger.info("Empty database detected. Seeding foundational panchayats...")
                panchayats_data = [
                    {"name": "Dhapewada", "lat": 21.282, "lon": 78.895},
                    {"name": "Mohpa", "lat": 21.325, "lon": 78.818},
                    {"name": "Ubali", "lat": 21.250, "lon": 78.910},
                    {"name": "Kalmeshwar Central", "lat": 21.233, "lon": 78.917},
                    {"name": "Brahmapuri", "lat": 20.612, "lon": 79.856},
                ]
                for p in panchayats_data:
                    pan = Panchayat(
                        name=p["name"],
                        block="Kalmeshwar",
                        district="Nagpur",
                        state="Maharashtra",
                        lat=p["lat"],
                        lng=p["lon"],
                    )
                    db.add(pan)
                db.commit()

            # Check if admin user exists; if not, seed users
            admin_user = db.query(User).filter(User.username == "MS-ADMIN-NGP-001").first()
            if not admin_user:
                logger.info("Seeding default demo admin, officer, and farmer users...")
                # 1. Admin
                admin = User(
                    role=UserRole.admin,
                    username="MS-ADMIN-NGP-001",
                    password_hash=get_password_hash("admin123"),
                    is_active=True,
                )
                db.add(admin)
                db.flush()
                db.add(AdminProfile(
                    user_id=admin.id,
                    name="Dr. P. K. Deshmukh",
                    district_scope="Nagpur",
                ))

                # 2. Officer
                officer = User(
                    role=UserRole.officer,
                    username="MS-OFFICER-001",
                    password_hash=get_password_hash("officer123"),
                    is_active=True,
                )
                db.add(officer)
                db.flush()
                db.add(OfficerProfile(
                    user_id=officer.id,
                    name="Rajesh Sharma",
                    department="Agriculture",
                    designation="Agricultural Extension Officer",
                    block="Kalmeshwar",
                    district="Nagpur",
                ))

                # 3. Farmer
                first_pan = db.query(Panchayat).first()
                farmer = User(
                    role=UserRole.farmer,
                    phone="9812345678",
                    is_active=True,
                )
                db.add(farmer)
                db.flush()
                farmer_prof = FarmerProfile(
                    user_id=farmer.id,
                    panchayat_id=first_pan.id if first_pan else 1,
                    name="Ramesh Patel",
                    preferred_language=Language.hi,
                    land_area_acres=4.5,
                    state="Maharashtra",
                    district="Nagpur",
                    block="Kalmeshwar",
                    onboarding_completed=True,
                )
                db.add(farmer_prof)
                db.flush()
                db.add(FarmerCrop(farmer_id=farmer_prof.id, crop_id="soybean", area_acres=2.5))
                db.add(FarmerCrop(farmer_id=farmer_prof.id, crop_id="cotton", area_acres=2.0))

                db.commit()
                logger.info("Default seed data successfully populated.")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Database table initialization/seed notice: {e}")

