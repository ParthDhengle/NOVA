from langgraph_supervisor import create_supervisor

from src.ai.llm.chat import groq_llm
from src.ai.prompts.supervisor import SuperPrompt
from src.ai.agents.agentlist import agents
from src.ai.schema.states import NOVAState

supervisor=create_supervisor(
    agents=agents,
    model=groq_llm,
    tools=[]
)
supervisor_graph=supervisor.compile()

def supervisor_node(state: NOVAState):
    response = supervisor_graph.invoke({"messages": state["messages"]})

    final_agent_response = response["messages"][-1]
    return {"draft_response": final_agent_response.content}
