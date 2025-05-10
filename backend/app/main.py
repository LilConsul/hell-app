from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.dependencies import get_user_repository
from .auth.service import AuthService
from .database import init_db
from .middleware.timezone_middleware import TimezoneMiddleware
from .router import router
from .settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Initialize the admin user
    user_repository = get_user_repository()
    auth_service = AuthService(user_repository)
    await auth_service.initialize_admin()

    yield


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
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

app.include_router(router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
