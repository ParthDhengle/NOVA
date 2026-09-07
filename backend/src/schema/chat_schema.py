from pydantic import BaseModel

class QuerySchema(BaseModel):
    query:str
    session_id:str