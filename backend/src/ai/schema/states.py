from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage


class NOVAState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    summary: str
    user_query: str
    user_memory: list[dict]
    draft_response: str
    final_response: str
    should_write: bool
    long_term_memory: list[dict]
