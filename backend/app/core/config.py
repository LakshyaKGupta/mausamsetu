from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://gramuser:grampass@127.0.0.1:5432/gramweather"
    OPEN_METEO_API_KEY: Optional[str] = None
    IMD_API_KEY: Optional[str] = None
    IMD_BASE_URL: str = "https://api.imd.gov.in/api/v1"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
