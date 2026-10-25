from fastapi import APIRouter,HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from .schemas import MessageRequest
from .services import start_chat_run,stream_chat_run
from user_server.services import is_authenticated
from utils.database import get_db

chat_router=APIRouter(prefix="/api/chat")

@chat_router.post("/")
async def start_chat(body:MessageRequest, request: Request, current_user=Depends(is_authenticated)):
    graph=request.app.state.graph
    user_id=str(current_user.id)
    return await start_chat_run(graph,body, user_id)

@chat_router.get("/{chat_id}/stream")
async def stream_run(chat_id:str, run_id:str, current_user=Depends(is_authenticated),):
    user_id=str(current_user.id)
    try:
        events =stream_chat_run(run_id,user_id)
        return StreamingResponse(
            events,
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))