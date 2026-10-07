from ai.prompts.final_response import ResponsePrompt
from ai.schema.states import NOVAState
from ai.llm.chat import groq_llm
from ai.schema.response import Response

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