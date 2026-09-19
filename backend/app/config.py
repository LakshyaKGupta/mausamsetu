import os
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = os.path.join(os.path.dirname(__file__), "../.env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ENV_PATH if os.path.exists(ENV_PATH) else ".env"),
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql://mausamsetu:mausamsetu_dev@localhost:5432/mausamsetu"
    SECRET_KEY: str = "dev_secret_key_change_in_production_min_32_chars"
    ENVIRONMENT: str = "development"
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    IMD_BASE_URL: str = "https://api.imd.gov.in/v1"
    IMD_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days


settings = Settings()
