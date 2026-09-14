from src.ai.prompts.final_response import ResponsePrompt
from src.ai.schema.states import NOVAState
from src.ai.llm.chat import groq_llm
from src.ai.schema.response import Response

async def final_response(state:NOVAState):
    response_llm= groq_llm.with_structured_output(Response)
    prompt = ResponsePrompt.format(
        user_query=state["user_query"],
        messages=state["messages"],
        user_memory=state["user_memory"],
        summary=state["summary"],
        final_response=state["draft_response"]
    )
    response=await response_llm.ainvoke(prompt)

    return response.model_dump()