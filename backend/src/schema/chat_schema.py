from pydantic import BaseModel

class QuerySchema(BaseModel):
    user_id: str
    thread_id: str
    user_query: str