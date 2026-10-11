from contextlib import asynccontextmanager

from fastapi import FastAPI
from langchain_core.messages import HumanMessage
from utils.database import langgraph_db

# from .chat.chat_schema import QuerySchema
from ai.graph.main_graph import builder
from fastapi.middleware.cors import CORSMiddleware
from user_server.routers import user_router
from utils.database import create_tables
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    await langgraph_db.connect()
    await langgraph_db.setup()
    app.state.graph = builder.compile(checkpointer=langgraph_db.checkpointer, store=langgraph_db.store)
    yield
    await langgraph_db.close()

app=FastAPI(title="NOVA Backend",lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://novaagent-by-parth.vercel.app/","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router)

@app.get("/")
def home():
    return {
        "msg":"Welcome to NOVA Backend"
    }

@app.get("/health")
def home():
    return {"status":"ok"}

