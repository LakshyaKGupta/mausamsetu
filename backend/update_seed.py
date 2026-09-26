import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import update
from app.models.location import Panchayat
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def update_data():
    async with AsyncSessionLocal() as session:
        # Mark all existing panchayats as test data
        await session.execute(
            update(Panchayat).values(is_test_data=True)
        )
        await session.commit()
        print("Updated Panchayats to is_test_data=True")

if __name__ == "__main__":
    asyncio.run(update_data())
