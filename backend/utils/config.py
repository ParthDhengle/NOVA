from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):

    model_config=SettingsConfigDict(env_file='.env',extra='ignore')

    SQLALCHEMY_DB_URL:str
    LANGGRAPH_DB_URL:str
    GEMINI_API_KEY:str
    ACCESS_TOKEN_EXPIRE_MINUTES:int
    ALGORITHM:str
    SECRET_KEY:str

settings=Settings()