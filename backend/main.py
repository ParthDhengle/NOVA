from fastapi import FastAPI
from src2.routers.chat_router import chat

app=FastAPI(title="NOVA Backend")


app.include_router(chat)

@app.get("/")
def home():
    return {
        "msg":"Welcome to NOVA Backend"
    }