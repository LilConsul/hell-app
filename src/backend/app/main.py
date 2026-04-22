import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.dependencies import get_user_repository
from .auth.service import AuthService
from .database import init_db
from .middleware import LanguageMiddleware, TimezoneMiddleware
from .router import router
from .settings import settings
from .storage.infrastructure import ensure_bucket_exists

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Initialize the admin user
    user_repository = get_user_repository()
    auth_service = AuthService(user_repository)
    await auth_service.initialize_test_users()

    # Initialize MinIO bucket
    try:
        await ensure_bucket_exists()
        logger.info("MinIO bucket initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MinIO bucket: {e}")
        # Don't fail startup, but log the error

    yield


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    root_path="/api",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TimezoneMiddleware)
app.add_middleware(LanguageMiddleware)

app.include_router(router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "HellApp API is running"}
