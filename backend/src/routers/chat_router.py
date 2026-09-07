from src2.services.chat_service import process_query
from src2.schema.chat_schema import QuerySchema
from fastapi import APIRouter

chat=APIRouter(prefix="/chat")

@chat.post("/process_query")
def process_query_router(body:QuerySchema):
    return process_query(body)
