from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days


settings = Settings()
