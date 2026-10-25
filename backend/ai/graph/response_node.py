
from langchain_core.messages import AIMessage

from ai.prompts.final_response import ResponsePrompt
from ai.schema.states import NOVAState
from ai.llm.chat import groq_llm
from ai.schema.response import Response


async def final_response(state: NOVAState):
    response_llm = groq_llm.with_structured_output(Response)

    prompt = ResponsePrompt.format(
        user_query=state["user_query"],
        messages=state.get("messages", []),
        user_memory=state.get("user_memory", []),
        summary=state.get("summary", ""),
        final_response=state.get("draft_response", ""),
    )

    response: Response = await response_llm.ainvoke(prompt)

    return {
        "messages": [AIMessage(content=response.final_response)],
        "final_response": response.final_response,
        "should_write": response.should_write,
        "long_term_memory": [
            item.model_dump() for item in response.long_term_memory
        ],
    }
