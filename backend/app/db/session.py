import logging
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

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
        logger.warning(f"PostgreSQL not reachable ({e}). Falling back to local SQLite for development.")
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
