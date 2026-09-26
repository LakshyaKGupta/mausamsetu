import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, engine
from app.models.models import (
    Base, User, UserRole, FarmerProfile, OfficerProfile, AdminProfile, 
    FarmerCrop, Panchayat, Language
)
from app.api.auth import get_password_hash

def seed_db():
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Panchayat).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding Panchayats...")
        panchayats_data = [
            {"name": "Dhapewada", "lat": 21.282, "lon": 78.895},
            {"name": "Mohpa", "lat": 21.325, "lon": 78.818},
            {"name": "Ubali", "lat": 21.250, "lon": 78.910},
        ]
        
        for p in panchayats_data:
            pan = Panchayat(
                name=p["name"],
                block="Kalmeshwar",
                district="Nagpur",
                state="Maharashtra",
                lat=p["lat"],
                lng=p["lon"]
            )
            db.add(pan)
        db.commit()

        panchayat = db.query(Panchayat).first()

        print("Seeding Users...")
        # 1. Admin
        admin_user = User(
            role=UserRole.admin,
            username="MS-ADMIN-NGP-001",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin_user)
        db.flush()
        
        db.add(AdminProfile(
            user_id=admin_user.id,
            name="Dr. P. K. Deshmukh",
            district_scope="Nagpur"
        ))

        # 2. Officer
        officer_user = User(
            role=UserRole.officer,
            username="MS-OFFICER-001",
            password_hash=get_password_hash("officer123"),
            is_active=True
        )
        db.add(officer_user)
        db.flush()
        
        db.add(OfficerProfile(
            user_id=officer_user.id,
            name="Rajesh Sharma",
            department="Agriculture",
            designation="Agricultural Extension Officer",
            block="Kalmeshwar",
            district="Nagpur"
        ))

        # 3. Farmer
        farmer_user = User(
            role=UserRole.farmer,
            phone="9812345678",
            is_active=True
        )
        db.add(farmer_user)
        db.flush()
        
        farmer_profile = FarmerProfile(
            user_id=farmer_user.id,
            panchayat_id=panchayat.id,
            name="Ramesh Patel",
            preferred_language=Language.hi,
            land_area_acres=4.5,
            state="Maharashtra",
            district="Nagpur",
            block="Kalmeshwar",
            onboarding_completed=True
        )
        db.add(farmer_profile)
        db.flush()

        db.add(FarmerCrop(farmer_id=farmer_profile.id, crop_id="soybean", area_acres=2.5))
        db.add(FarmerCrop(farmer_id=farmer_profile.id, crop_id="cotton", area_acres=2.0))

        db.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
