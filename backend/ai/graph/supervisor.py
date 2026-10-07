from langgraph_supervisor import create_supervisor

from ai.llm.chat import groq_llm
from ai.prompts.supervisor import SuperPrompt,SupervisorInstructions
from ai.agents.agentlist import agents
from ai.schema.states import NOVAState

supervisor=create_supervisor(
    agents=agents,
    model=groq_llm,
    prompt=SupervisorInstructions
)
supervisor_graph=supervisor.compile()

async def supervisor_node(state: NOVAState):
    response = await supervisor_graph.ainvoke({"messages": state["messages"]})

    final_agent_response = response["messages"][-1]
    return {"draft_response": final_agent_response.content}
