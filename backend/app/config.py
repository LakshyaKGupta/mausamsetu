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
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    OPENMETEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_API_KEY: str = ""
    IMD_BASE_URL: str = "https://api.imd.gov.in/v1"
    IMD_API_KEY: str = ""
    DELIVERY_PROVIDER: str = ""
    DELIVERY_API_KEY: str = ""
    MODEL_EVALUATION_PATH: str = os.path.join(os.path.dirname(__file__), "ml/artifacts/phase6_research_evaluation.json")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() in {"development", "demo", "test"}

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        defaults = ["http://localhost:5173", "http://localhost:3000", "https://mausamsetu.vercel.app"]
        for d in defaults:
            if d not in origins:
                origins.append(d)
        return origins


settings = Settings()
