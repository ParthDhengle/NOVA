from src2.ai.response import simple_response
#from src2.ai.response import agentic_response
from src.schema.chat_schema import QuerySchema

def process_query(body:QuerySchema):
    query=body.query
    session_id=body.session_id
    response = simple_response(query)
    return{
        "display_response":response,
        "mode":"direct"
    }
