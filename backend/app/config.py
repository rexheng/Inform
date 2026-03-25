from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./inform.db"
    postcodes_io_url: str = "https://api.postcodes.io"
    nhs_stats_base_url: str = "https://www.england.nhs.uk/statistics/wp-content/uploads/sites/2"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    groq_api_key: str = ""

    model_config = {"env_prefix": "INFORM_"}


settings = Settings()
