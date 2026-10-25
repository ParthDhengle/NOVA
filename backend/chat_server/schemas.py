from typing import Literal
from pydantic import BaseModel, Field

class MessageRequest(BaseModel):
    message: str= Field(min_length=1, max_length=20000)
    chat_id:str | None=None
    project_id:str| None=None
    agent_id:str | None = None
    model_id: str | None= None
    tool_ids: list[str] = Field(default_factory=list)
    connector_ids: list[str] = Field(default_factory=list)
    file_ids: list[str] = Field(default_factory=list)


class StartRunResponse(BaseModel):
    chat_id: str
    run_id: str