import logging
from enum import Enum

# Import from your config module
from .settings import settings

LOG_FORMAT_DEBUG = "%(levelname)s:%(message)s:%(pathname)s:%(funcName)s:%(lineno)d"


class LogLevels(str, Enum):
    info = "INFO"
    warn = "WARN"
    error = "ERROR"
    debug = "DEBUG"


def configure_logging():
    log_level = str(settings.LOG_LEVEL).upper()  # cast to string
    log_levels = [item.value for item in LogLevels]

    if log_level not in log_levels:
        # we use error as the default log level
        logging.basicConfig(level=LogLevels.error.value)
        return

    if log_level == LogLevels.debug.value:
        logging.basicConfig(level=log_level, format=LOG_FORMAT_DEBUG)
    else:
        logging.basicConfig(level=log_level)

    # Silence overly verbose loggers for the dependencies you're using

    # FastAPI/Uvicorn related
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.ERROR)

    # MongoDB/Beanie related
    logging.getLogger("beanie").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)

    # FastAPI-Users related
    logging.getLogger("fastapi_users").setLevel(logging.WARNING)

    # OAuth related (if using the OAuth features)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # JWT related
    logging.getLogger("jose").setLevel(logging.WARNING)
    logging.getLogger("jwt").setLevel(logging.WARNING)

    # Email related
    logging.getLogger("fastapi_mail").setLevel(logging.WARNING)
    logging.getLogger("aiosmtplib").setLevel(logging.ERROR)
