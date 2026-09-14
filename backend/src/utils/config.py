from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):

    model_config=SettingsConfigDict(env_file='.env',extra='ignore')

    DB_URL:str
    GEMINI_API_KEY:str

settings=Settings()