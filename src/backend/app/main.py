from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from .auth.dependencies import get_user_repository
from .auth.service import AuthService
from .database import init_db
from .i18n import _
from .middleware import LanguageMiddleware, RootPathMiddleware, TimezoneMiddleware
from .router import router
from .settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Initialize the admin user
    user_repository = get_user_repository()
    auth_service = AuthService(user_repository)
    await auth_service.initialize_test_users()

    yield


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Custom OpenAPI schema generator function to ensure version field is included
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    # We'll use the first root path (usually /api) for all OpenAPI schema URLs
    primary_root_path = settings.ROOT_PATHS[0]

    openapi_schema = get_openapi(
        title=f"{settings.PROJECT_NAME} API",
        version="1.0.0",
        description="API documentation",
        routes=primary_root_path,
    )

    # Explicitly set the OpenAPI version field
    openapi_schema["openapi"] = "3.0.2"

    # Fix the server URL to use our primary root path
    openapi_schema["servers"] = [{"url": primary_root_path}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Override the default OpenAPI schema with our custom one
app.openapi = custom_openapi


app.add_middleware(RootPathMiddleware)

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
    return {"message": _("Hello World")}
