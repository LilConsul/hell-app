import logging
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

log = logging.getLogger(__name__)


class Settings(BaseSettings):
    # # Redis settings
    # REDIS_PORT: int
    # REDIS_HOST: str
    #
    # @property
    # def REDIS_URL(self) -> str:
    #     return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Security settings
    SECRET_KEY: str
    ALGORITHM: str
    PROJECT_NAME: str
    CORS_ORIGINS: List[str]
    DEBUG: bool
    DOMAIN: str
    ACCESS_TOKEN_EXPIRE_SECONDS: int

    LOG_LEVEL: int = logging.WARNING

    # Email settings
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: str
    SMTP_PORT: int
    SMTP_HOST: str
    EMAIL_FROM_NAME: str

    # MongoDB settings
    MONGO_INITDB_ROOT_USERNAME: str
    MONGO_INITDB_ROOT_PASSWORD: str
    MONGO_INITDB_DATABASE: str
    MONGO_PORT: int
    MONGO_HOST: str

    @property
    def MONGODB_URL(self) -> str:
        return f"mongodb://{self.MONGO_INITDB_ROOT_USERNAME}:{self.MONGO_INITDB_ROOT_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_INITDB_DATABASE}"

    # URL paths
    VERIFY_MAIL_PATH: str

    @property
    def VERIFY_MAIL_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.VERIFY_MAIL_PATH}"

    PASSWORD_RESET_PATH: str

    @property
    def PASSWORD_RESET_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.PASSWORD_RESET_PATH}"

    # Backend settings
    BACKEND_PORT_INTERNAL: int

    BASE_DIR: Path = Path(__file__).resolve().parent
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent

    model_config = SettingsConfigDict(
        env_file=".",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
