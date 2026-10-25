from .schemas import MessageRequest
from langchain.messages import HumanMessage
import asyncio
import json
from uuid import uuid4


active_runs: dict[str, dict] = {}
async def start_chat_run(graph , body : MessageRequest, user_id:str):
    chat_id=body.chat_id or str(uuid4())
    run_id=str(uuid4())
    queue=asyncio.Queue()
    active_runs[run_id] = {
        "chat_id": chat_id,
        "user_id": user_id,
        "queue": queue,
        "task": None,
    }
    config = {
        "configurable": {
            "thread_id": chat_id,
            "user_id": user_id,
        }
    }
    initial_state = {
        "messages": [HumanMessage(content=body.message)],
        "user_query": body.message,
        "should_write": False,
    }

    async def execute_graph():
        try:
            async for update in graph.astream(initial_state,config=config,stream_mode="updates"):
                response_state = update.get("response")

                if response_state:
                    answer = response_state.get("final_response", "")

                    if answer:
                        await queue.put({
                            "type": "message_delta",
                            "run_id": run_id,
                            "delta": answer,
                        })

            await queue.put({"type": "run_complete", "run_id": run_id })
        
        except Exception:
            await queue.put({
                "type": "error",
                "run_id": run_id,
                "message": "The agent run failed.",
            })
        finally:
            await queue.put(None)
    task=asyncio.create_task(execute_graph())
    active_runs[run_id]["task"]=task

    return{
        "chat_id":chat_id,
        "run_id":run_id
    }

async def stream_chat_run(run_id:str,user_id:str):
    run=active_runs.get(run_id)

    if not run or run["user_id"] !=user_id:
        raise ValueError("Run Not found")

    queue=run["queue"]
    try:
        while True:
            event=await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"
    finally:
        if active_runs.get(run_id) is run:
            active_runs.pop(run_id,None)