from ai.schema.states import NOVAState
from langgraph.config import get_store

async def load_user_memory(state, config):
    store=get_store()
    user_id = config["configurable"]["user_id"]

    memories =await store.asearch(
        ("users", user_id),
        query=state["user_query"],
        limit=5,
    )

    return {
        "user_memory": [
            item.value for item in memories
        ]
    }

async def save_long_term_memory(state: NOVAState, config):
    user_id = config["configurable"]["user_id"]
    new_memories = state.get("long_term_memory", [])
    store=get_store()
    for memory in new_memories:
        memory_key = memory["key"]
        await store.aput(
            namespace=("users", user_id),
            key=memory_key,
            value=memory,
        )
    return {}