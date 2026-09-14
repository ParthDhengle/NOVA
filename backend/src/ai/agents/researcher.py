# agents/researcher.py

from langchain.agents import create_agent
from src.ai.llm.chat import groq_llm
from src.ai.agents.tools.web_search import web_search

researcher = create_agent(
    model=groq_llm,
    tools=[web_search],
    name="researcher_agent",
    system_prompt="You are a research agent. Use tools when needed.",
)