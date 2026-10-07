from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_core.tools import tool
from dotenv import load_dotenv
load_dotenv()

search=GoogleSerperAPIWrapper()


@tool
def web_search(query):
    """
        Search the web for current information.
        Args:
        query: search query
    """
    return search.results(query)
