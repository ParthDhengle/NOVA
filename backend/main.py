from contextlib import asynccontextmanager

from fastapi import FastAPI
from langchain_core.messages import HumanMessage
from src.utils.database import db

from src.schema.chat_schema import QuerySchema
from src.ai.graph.main_graph import builder

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    await db.setup()
    app.state.graph = builder.compile(checkpointer=db.checkpointer, store=db.store)
    yield
    await db.close()

app=FastAPI(title="NOVA Backend",lifespan=lifespan,)


@app.post("/chat")
async def chat(req:QuerySchema):
    config={"configurable":{"user_id":req.user_id, "thread_id":req.thread_id}}

    result = await app.state.graph.ainvoke(
        {
            "user_query": req.user_query,
            "messages": [
                HumanMessage(content=req.user_query)
            ],
            "summary": "",
            "user_memory": [],
            "draft_response": "",
            "final_response": "",
            "should_write": False,
            "long_term_memory": [],
        },
        config=config
    )

    return {"response":result["final_response"]}


@app.get("/")
def home():
    return {
        "msg":"Welcome to NOVA Backend"
    }