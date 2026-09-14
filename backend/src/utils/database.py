#postgres initialzation
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore
from psycopg_pool import AsyncConnectionPool

from src.utils.config import settings

class Database:
    def __init__(self):

        self.pool = None
        self.checkpointer = None
        self.store = None

    async def connect(self):

        self.pool = AsyncConnectionPool(
            conninfo=settings.DB_URL,
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

db = Database()