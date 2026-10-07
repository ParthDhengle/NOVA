#postgres initialzation
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore
from psycopg_pool import AsyncConnectionPool
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from .config import settings

Base= declarative_base()
engine=create_async_engine(url=settings.SQLALCHEMY_DB_URL,echo=False)

SessionLocal=async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with SessionLocal() as session:
        yield session

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

class Database:
    def __init__(self):

        self.pool = None
        self.checkpointer = None
        self.store = None

    async def connect(self):

        self.pool = AsyncConnectionPool(
            conninfo=settings.LANGGRAPH_DB_URL,
            min_size=1,
            max_size=10,
            open=False,
        )

        await self.pool.open(wait=True)

        self.checkpointer = AsyncPostgresSaver(self.pool)
        self.store = AsyncPostgresStore(self.pool)

    async def setup(self):
        await self.checkpointer.setup()
        await self.store.setup()

    async def close(self):
        if self.pool:
            await self.pool.close()

langgraph_db = Database()