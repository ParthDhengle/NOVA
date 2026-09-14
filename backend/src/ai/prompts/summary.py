SummaryPrompt="""
You are a conversation memory manager.

Existing summary:
{summary}

Old conversation:
{old_messages}

Create an updated concise summary.

Preserve:
- User facts relevant to this conversation
- Important decisions
- Project context
- Unfinished tasks
- Important technical details

Do not invent information.
"""