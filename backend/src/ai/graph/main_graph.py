from langgraph.graph import StateGraph, START,END

from src.ai.schema.states import NOVAState
from src.utils.database import db
from src.ai.context.long_term_memory import save_long_term_memory, load_user_memory
from src.ai.context.short_term_memory import manage_short_term_memory


from src.ai.context.context_manager import prepare_context
from .supervisor import supervisor_node
from .response_node import final_response

builder=StateGraph(NOVAState)

def have_ltm(state:NOVAState):
    return state["should_write"]

builder.add_node("load_memory",load_user_memory)
builder.add_node("prepare_context",prepare_context)
builder.add_node("supervisor",supervisor_node)
builder.add_node("response",final_response)
builder.add_node("store_ltm", save_long_term_memory)
builder.add_node("manage_stm", manage_short_term_memory)


builder.add_edge(START, "load_memory")
builder.add_edge("load_memory","prepare_context")
builder.add_edge("prepare_context","supervisor",)
builder.add_edge("supervisor","response",)
builder.add_conditional_edges("response",have_ltm,{True:"store_ltm",False:"manage_stm"})
builder.add_edge("store_ltm","manage_stm",)
builder.add_edge("manage_stm",END)


graph = builder.compile(
    checkpointer=db.checkpointer,
    store=db.store,
)