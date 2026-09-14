#postgres initialzation
from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.store.postgres import PostgresStore
from psycopg_pool import ConnectionPool
from src.utils.config import settings

class Database:
    def __init__(self):

        self.pool = None
        self.checkpointer = None
        self.store = None

    def connect(self):

        self.pool = ConnectionPool(
            conninfo=settings.DB_URL,
            min_size=1,
            max_size=10,
            open=False,
        )

        self.pool.open(wait=True)

        self.checkpointer = PostgresSaver(self.pool)
        self.store = PostgresStore(self.pool)

    def setup(self):

        self.checkpointer.setup()
        self.store.setup()

    def close(self):

        if self.pool:
            self.pool.close()

db = Database()