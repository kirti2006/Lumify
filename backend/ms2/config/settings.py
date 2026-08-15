"""Application settings and configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Lumify AI Microservice MS-2"
    app_version: str = "1.0.0"
    debug: bool = False

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/lumify_ai"
    )
    database_pool_size: int = 20
    database_max_overflow: int = 10
    database_echo: bool = False

    redis_url: str = Field(default="redis://localhost:6379/0")
    redis_max_connections: int = 50

    llm_provider: str = Field(default="groq")

    # Groq settings (free tier — meta-llama/llama-4-scout-17b-16e-instruct)
    groq_api_key: str = Field(default="")
    groq_default_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    groq_default_temperature: float = 0.7
    groq_default_timeout: int = 120
    groq_max_retries: int = 3

    jwt_secret_key: str = Field(default="your-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    internal_api_key: str = Field(default="internal-api-key-change-in-production")

    log_level: str = "INFO"
    log_format: str = "json"

    cors_origins: list[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    rate_limit_per_minute: int = 60

    session_ttl_seconds: int = 3600
    max_conversation_history: int = 100


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()