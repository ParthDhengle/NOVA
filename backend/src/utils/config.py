from pydantic_settings import BaseSettings,SettingsConfigDict

class Config(BaseSettings):
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')

    GEMINI_API_KEY:str

config=Config()