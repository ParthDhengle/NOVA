from pydantic import BaseModel, Field
from typing import Literal, List

class MemoryItem(BaseModel):
    key: str = Field(description="Short unique memory key")
    value: str = Field(description="The durable user fact")

class Response(BaseModel):
    final_response:str=Field(description="final response after the query")
    should_write:bool=Field(description="whether to store any memories")
    long_term_memory:list[MemoryItem]=Field(default_factory=list,description="Atomic user memories to store")
