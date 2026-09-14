from src.ai.schema.states import NOVAState

def load_user_memory(state, config, *, store):
    user_id = config["configurable"]["user_id"]

    memories = store.search(
        ("users", user_id),
        query=state["user_query"],
        limit=5,
    )

    return {
        "user_memory": [
            item.value for item in memories
        ]
    }

def save_long_term_memory(state: NOVAState, config, *, store):
    user_id = config["configurable"]["user_id"]
    new_memories = state.get("long_term_memory", [])

    for memory in new_memories:
        memory_key = memory["key"]
        store.put(
            namespace=("users", user_id),
            key=memory_key,
            value=memory,
        )
    return {}