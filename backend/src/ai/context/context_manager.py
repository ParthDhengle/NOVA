from src.ai.schema.states import NOVAState
from langchain_core.messages import SystemMessage
from src.ai.prompts.supervisor import SuperPrompt

def prepare_context(state:NOVAState):

    summary=state.get("summary","")
    user_memory=state.get("user_memory",[])
    messages=state.get("messages",[])
    context_message=SystemMessage(
            content=SuperPrompt.format(
            user_query=state["user_query"],
            user_memory=state["user_memory"],
            summary=state["summary"],
        )
    )
    return{
        "messages":[
            context_message,
            *state["messages"]
        ]
    }
