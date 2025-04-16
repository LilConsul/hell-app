import pytest
from faker import Faker
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient
from app.main import app
from beanie import init_beanie
from app.auth.models import User


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
def fake():
    return Faker()


@pytest.fixture(autouse=True)
async def my_fixture():
    client = AsyncMongoMockClient()
    await init_beanie(document_models=[User], database=client.get_database(name="db"))
