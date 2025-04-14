import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .logging import configure_logging
from .settings import settings

log = logging.getLogger(__name__)

configure_logging()

app = FastAPI(
    title="Backend API",
    root_path="/api",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}
