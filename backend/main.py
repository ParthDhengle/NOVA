from contextlib import asynccontextmanager

from fastapi import FastAPI
from src.routers.chat_router import chat
from src.utils.database import db

@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup
    db.connect()
    db.setup()

    app.state.graph = build_graph()

    yield

    # Shutdown
    db.close()

app=FastAPI(title="NOVA Backend",lifespan=lifespan,)


app.include_router(chat)

@app.get("/")
def home():
    return {
        "msg":"Welcome to NOVA Backend"
    }