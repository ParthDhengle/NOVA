# agents/researcher.py

from langchain.agents import create_agent
from src.ai.llm import groq_llm
from src.ai.agents.tools import web_search

researcher = create_agent(
    model=groq_llm,
    tools=[web_search],
    name="researcher",
    prompt="You are a research agent. Use tools when needed.",
)