from src.ai.llm.chat import groq_llm
from src.ai.schema.states import NOVAState
from src.ai.prompts.summary import SummaryPrompt


import os
from langchain_core.messages.utils import count_tokens_approximately
from langchain_core.messages import HumanMessage,RemoveMessage

async def manage_short_term_memory(state:NOVAState):
    messages=state.get("messages",[])
    summary=state.get("summary","")

    token_count=count_tokens_approximately(messages)
    MAX_TOKENS=int(os.getenv("MAX_TOKENS",4000))

    if token_count<= MAX_TOKENS :
        return {}

    KEEP_MESSAGES=int(os.getenv("KEEP_MESSAGES",8))

    old_message=messages[:-KEEP_MESSAGES]

    summary_prompt=SummaryPrompt.format(summary=summary,old_messages=old_message)

    response=await groq_llm.ainvoke([
        HumanMessage(content=summary_prompt)
    ])

    new_summary=response.content

    delete_message=[RemoveMessage(id=m.id) for m in old_message if m.id is not None]

    return {
        "summary":new_summary,
        "messages":delete_message,
    }