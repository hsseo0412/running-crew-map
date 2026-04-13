from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Running Crew Map API"
    debug: bool = False

    database_url: str = "postgresql://postgres:postgres@postgres:5432/running_crew"
    redis_url: str = "redis://redis:6379"

    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
