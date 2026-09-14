from langchain_groq import ChatGroq
from dotenv import load_dotenv
load_dotenv()

groq_llm=ChatGroq(model="openai/gpt-oss-20b")