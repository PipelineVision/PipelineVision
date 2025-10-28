import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    API_V1_STR: str = "/api/v1"
    GITHUB_URL: str = "https://api.github.com"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    POSTGRES_HOST: str = str(os.getenv("POSTGRES_HOST"))
    POSTGRES_USER: str = str(os.getenv("POSTGRES_USER"))
    POSTGRES_PASSWORD: str = str(os.getenv("POSTGRES_PASSWORD"))
    POSTGRES_DB: str = str(os.getenv("POSTGRES_DB"))
    POSTGRES_PORT: str = str(os.getenv("POSTGRES_PORT"))

    REDIS_URL: str = str(os.getenv("REDIS_URL"))

    GITHUB_APP_ID: str = str(os.getenv("GITHUB_APP_ID"))
    GITHUB_APP_PRIVATE_KEY: str = str(os.getenv("GITHUB_APP_PRIVATE_KEY"))
    GITHUB_APP_WEBHOOK_SECRET: str = str(os.getenv("GITHUB_APP_WEBHOOK_SECRET"))

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
