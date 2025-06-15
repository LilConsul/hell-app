# Test the main FastAPI application.
async def test_read_main(client):
    """Test the main endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
