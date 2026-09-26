import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.advisory import Advisory
from app.models.location import Panchayat, Block
from app.models.officer_ops import FieldReport

async def seed():
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        # Get panchayats for Kalmeshwar
        result = await session.execute(
            select(Panchayat).join(Block).filter(Block.name == "Kalmeshwar").limit(5)
        )
        panchayats = result.scalars().all()
        
        if not panchayats:
            print("No panchayats found for Kalmeshwar! Can't seed.")
            # fallback: just get any 5 panchayats
            result = await session.execute(select(Panchayat).limit(5))
            panchayats = result.scalars().all()
            if not panchayats:
                print("No panchayats at all! DB is empty?")
                return

        for i, pan in enumerate(panchayats):
            adv = Advisory(
                panchayat_id=pan.id,
                crop="Soybean" if i % 2 == 0 else "Cotton",
                crop_stage="Vegetative",
                status="pending" if i < 3 else "approved",
                baseline_rainfall_mm=12.5 + i,
                predicted_rainfall_mm=18.0 + i,
                model_diff_mm=5.5,
                content_en=f"Heavy rain expected. Delay spraying for {pan.name}.",
                content_hi=f"भारी बारिश की संभावना। {pan.name} में छिड़काव टालें।"
            )
            session.add(adv)
            
            fr = FieldReport(
                officer_id=1,
                panchayat_id=pan.id,
                crop="Cotton",
                category="pest_disease",
                severity="medium" if i % 2 == 0 else "high",
                observation_notes=f"Pink bollworm spotted in {pan.name}",
                action_recommended="Apply neem oil"
            )
            session.add(fr)
            
        await session.commit()
        print(f"Seeded {len(panchayats)} advisories and field reports.")

if __name__ == "__main__":
    asyncio.run(seed())
