from app.core.config import settings

try:
    import aiosqlite  # noqa: F401
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker

    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("sqlite://") and not db_url.startswith("sqlite+aiosqlite://"):
        db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

    try:
        engine = create_async_engine(db_url, echo=False)
    except Exception:
        engine = create_async_engine("sqlite+aiosqlite:///./mausamsetu.db", echo=False)

    AsyncSessionLocal = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    HAVE_ASYNC_DB = True
except Exception:
    engine = None
    AsyncSession = None
    AsyncSessionLocal = None
    HAVE_ASYNC_DB = False

try:
    import greenlet
    HAVE_GREENLET = True
except ImportError:
    HAVE_GREENLET = False


class DummyAsyncSession:
    async def execute(self, *args, **kwargs):
        class DummyResult:
            def first(self):
                return None
            def all(self):
                return []
            def scalars(self):
                return self
        return DummyResult()

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass

    def add(self, *args):
        pass

    def add_all(self, *args):
        pass


async def get_db():
    if not HAVE_ASYNC_DB or not HAVE_GREENLET or AsyncSessionLocal is None:
        yield DummyAsyncSession()
        return
    async with AsyncSessionLocal() as session:
        yield session
