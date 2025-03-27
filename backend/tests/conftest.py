import asyncio

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.settings import settings

# Create a test database helper
# test_db_helper = DatabaseHelper(url=settings.TEST_DATABASE_URL, echo=True)
# app.dependency_overrides[db_helper.session_dependency] = (
#     test_db_helper.session_dependency
# )


# @pytest.fixture(autouse=True, scope="function")
# async def setup_database():
#     """Setup and teardown the test database for each test."""
#     # Create tables
#     async with test_db_helper.engine.begin() as conn:
#         await conn.run_sync(Base.metadata.drop_all)
#         await conn.run_sync(Base.metadata.create_all)
#
#     # Execute the test
#     yield
#
#     # Clean up after test
#     async with test_db_helper.engine.begin() as conn:
#         await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
