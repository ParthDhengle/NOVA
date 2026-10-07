# agents/coder.py

from langchain.agents import create_agent
from ai.llm.chat import groq_llm
from ai.agents.tools.web_search import web_search

coder = create_agent(
    tools=[web_search],
    model=groq_llm,
    name="coder_agent",
    system_prompt="You are a coding agent. Solve programming tasks.",
)