"""Application configuration, loaded from environment variables / .env file."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "TakeOFF Driver Onboarding API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+psycopg://takeoff:takeoff@localhost:5432/takeoff_onboarding"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production-this-is-a-dev-only-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # OTP
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    # In dev/demo mode there is no real SMS provider wired up. When true, the
    # generated OTP code is echoed back in the API response and server logs so
    # the flow can be exercised end-to-end without a telecom integration.
    OTP_DEBUG_ECHO: bool = True

    # File storage. Local disk by default; set S3_BUCKET_NAME to switch to
    # S3 (or an S3-compatible / GCS-interop endpoint via S3_ENDPOINT_URL) —
    # see app/services/storage_provider.py.
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_UPLOAD_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg"]
    S3_BUCKET_NAME: str | None = None
    S3_REGION: str | None = None
    S3_ENDPOINT_URL: str | None = None
    # AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are read directly by boto3
    # from the environment — no app-specific setting needed for them.

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    FIRST_ADMIN_EMAIL: str = "admin@takeoff.dev"
    FIRST_ADMIN_PASSWORD: str = "AdminPass123!"

    RATE_LIMIT_ENABLED: bool = True
    # In-memory rate limit storage by default (fine for one backend
    # instance). Set REDIS_URL to share limits across multiple instances.
    REDIS_URL: str | None = None

    # Real SMS delivery (optional). If unset, OTP codes are only logged
    # server-side (and echoed in the response when OTP_DEBUG_ECHO=true).
    TWILIO_ACCOUNT_SID: str | None = None
    TWILIO_AUTH_TOKEN: str | None = None
    TWILIO_FROM_NUMBER: str | None = None

    # Real email delivery (optional). If unset, notification emails are
    # only logged server-side.
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

DEFAULT_JWT_SECRET = "change-me-in-production-this-is-a-dev-only-secret"
DEFAULT_ADMIN_PASSWORD = "AdminPass123!"


def assert_production_config_is_safe() -> None:
    """Fail fast on boot rather than silently running production with
    dev-only defaults. Called once from the app's startup event."""
    if settings.ENVIRONMENT != "production":
        return

    problems = []
    if settings.JWT_SECRET_KEY == DEFAULT_JWT_SECRET:
        problems.append("JWT_SECRET_KEY is still the default dev value")
    if settings.FIRST_ADMIN_PASSWORD == DEFAULT_ADMIN_PASSWORD:
        problems.append("FIRST_ADMIN_PASSWORD is still the default dev value")
    if settings.DEBUG:
        problems.append("DEBUG is true")
    if settings.OTP_DEBUG_ECHO:
        problems.append("OTP_DEBUG_ECHO is true (OTP codes would leak in API responses)")

    if problems:
        raise RuntimeError(
            "Refusing to start with ENVIRONMENT=production and unsafe settings: " + "; ".join(problems)
        )
