from src.ai.schema.states import NOVAState
from langchain_core.messages import SystemMessage
from src.ai.prompts.supervisor import SuperPrompt

def prepare_context(state: NOVAState):

    context_message = SystemMessage(
        content=SuperPrompt.format(
            user_query=state.get("user_query", ""),
            user_memory=state.get("user_memory", []),
            summary=state.get("summary", ""),
        )
    )

    return {
        "messages": [
            context_message,
            *state.get("messages", [])
        ]
    }
