from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_core.tools import tool
search=GoogleSerperAPIWrapper()

@tool
def web_serch(query):
    """
        Search the web for current information.
        Args:
        query: search query
    """
    return search.results(query)
