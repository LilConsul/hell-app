from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Redis settings
    REDIS_PORT: int = Field(..., alias="REDIS_PORT_INTERNAL")
    REDIS_HOST: str

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Security settings
    SECRET_KEY: str
    ALGORITHM: str
    PROJECT_NAME: str
    CORS_ORIGINS: List[str] = Field(..., alias="BACKEND_CORS_ORIGINS")
    DEBUG: bool = Field(..., alias="BACKEND_DEBUG")
    DOMAIN: str
    ACCESS_TOKEN_EXPIRE_SECONDS: int

    # Admin
    ADMIN_EMAIL: str = Field(..., alias="ADMIN_EMAIL")
    ADMIN_PASSWORD: str = Field(..., alias="ADMIN_PASSWORD")

    # Cookie settings
    COOKIE_SECURE: bool = True
    COOKIE_DOMAIN: Optional[str] = None
    # OAuth Settings
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: Optional[str] = None

    # Email settings
    SMTP_USER: str
    SMTP_PASSWORD: str
    EMAILS_FROM_EMAIL: str
    SMTP_PORT: int
    SMTP_HOST: str
    EMAIL_FROM_NAME: str

    # MongoDB settings
    MONGO_USERNAME: str = Field(..., alias="MONGO_INITDB_ROOT_USERNAME")
    MONGO_PASSWORD: str = Field(..., alias="MONGO_INITDB_ROOT_PASSWORD")
    MONGO_DATABASE: str = Field(..., alias="MONGO_INITDB_DATABASE")
    MONGO_PORT: int
    MONGO_HOST: str

    @property
    def MONGODB_URL(self) -> str:
        return f"mongodb://{self.MONGO_USERNAME}:{self.MONGO_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}/{self.MONGO_DATABASE}?authSource=admin"

    # URL paths
    VERIFY_MAIL_PATH: str

    @property
    def VERIFY_MAIL_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.VERIFY_MAIL_PATH}"

    PASSWORD_RESET_PATH: str

    @property
    def PASSWORD_RESET_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.PASSWORD_RESET_PATH}"

    LOGIN_PATH: str

    @property
    def LOGIN_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.LOGIN_PATH}"

    EXAM_INSTANCE_PATH: str

    @property
    def EXAM_INSTANCE_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.EXAM_INSTANCE_PATH}"

    DELETE_ACCOUNT_PATH: str

    @property
    def DELETE_ACCOUNT_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.DELETE_ACCOUNT_PATH}"

    DASHBOARD_PATH: str

    @property
    def DASHBOARD_URL(self) -> str:
        return f"https://{self.DOMAIN}{self.DASHBOARD_PATH}"

    # Backend settings
    BACKEND_PORT_INTERNAL: int

    BASE_DIR: Path = Path(__file__).resolve().parent
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent

    model_config = SettingsConfigDict(
        env_file=".",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
