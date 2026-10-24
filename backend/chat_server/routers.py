from fastapi import APIRouter

chat=APIRouter(prefix="",)

@chat.get("/chats")
def chats():
    return