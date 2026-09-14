# agents/coder.py

from langgraph.prebuilt import create_react_agent
from src.ai.llm import groq_llm

coder = create_react_agent(
    model=groq_llm,
    name="coder",
    prompt="You are a coding agent. Solve programming tasks.",
)