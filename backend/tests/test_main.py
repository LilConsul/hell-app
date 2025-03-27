# Test the main FastAPI application.
async def test_read_main(client):
    """Test the main endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

# # Tests for the API endpoints
# async def test_create_item(client):
#     response = await client.post(
#         "/items/", json={"title": "New Item", "description": "This is a new item"}
#     )
#
#     assert response.status_code == 200
#     data = response.json()
#     assert data["title"] == "New Item"
#     assert data["description"] == "This is a new item"
#     assert "id" in data
#
#
# async def test_read_items(client):
#     """Test reading all items."""
#     # Create a sample item first
#     async with test_db_helper.session_dependency_context() as session:
#         item = Item(title="Test Item", description="This is a test item")
#         session.add(item)
#         await session.commit()
#         await session.refresh(item)
#         item_id = item.id
#
#     # Test reading all items
#     response = await client.get("/items/")
#
#     assert response.status_code == 200
#     data = response.json()
#     assert isinstance(data, list)
#     assert len(data) > 0
#     found_item = next((i for i in data if i["id"] == item_id), None)
#     assert found_item is not None
#     assert found_item["title"] == "Test Item"
#     assert found_item["description"] == "This is a test item"
#
#
# async def test_read_item(client):
#     """Test reading a specific item by ID."""
#     # Create a sample item first
#     async with test_db_helper.session_dependency_context() as session:
#         item = Item(title="Test Item", description="This is a test item")
#         session.add(item)
#         await session.commit()
#         await session.refresh(item)
#         item_id = item.id
#
#     # Test reading the item
#     response = await client.get(f"/items/{item_id}")
#
#     assert response.status_code == 200
#     data = response.json()
#     assert data["id"] == item_id
#     assert data["title"] == "Test Item"
#     assert data["description"] == "This is a test item"
#
#
# async def test_read_nonexistent_item(client):
#     """Test reading a non-existent item."""
#
#     response = await client.get("/items/999")
#
#     assert response.status_code == 404
#     assert response.json()["detail"] == "Item not found"
#
#
# async def test_update_item(client):
#     """Test updating an item."""
#     # Create a sample item first
#     async with test_db_helper.session_dependency_context() as session:
#         item = Item(title="Test Item", description="This is a test item")
#         session.add(item)
#         await session.commit()
#         await session.refresh(item)
#         item_id = item.id
#
#     # Test updating the item
#     updated_data = {"title": "Updated Title", "description": "Updated description"}
#
#     response = await client.put(f"/items/{item_id}", json=updated_data)
#
#     assert response.status_code == 200
#     data = response.json()
#     assert data["id"] == item_id
#     assert data["title"] == updated_data["title"]
#     assert data["description"] == updated_data["description"]
#
#
# async def test_update_nonexistent_item(client):
#     """Test updating a non-existent item."""
#     response = await client.put(
#         "/items/999",
#         json={"title": "Updated Title", "description": "Updated description"},
#     )
#
#     assert response.status_code == 404
#     assert response.json()["detail"] == "Item not found"
#
#
# async def test_delete_item(client):
#     """Test deleting an item."""
#     # Create a sample item first
#     async with test_db_helper.session_dependency_context() as session:
#         item = Item(title="Test Item", description="This is a test item")
#         session.add(item)
#         await session.commit()
#         await session.refresh(item)
#         item_id = item.id
#
#     # Test deleting the item
#     response = await client.delete(f"/items/{item_id}")
#
#     assert response.status_code == 200
#     data = response.json()
#     assert data["id"] == item_id
#
#     # Verify the item is deleted
#     response = await client.get(f"/items/{item_id}")
#     assert response.status_code == 404
#
#
# async def test_delete_nonexistent_item(client):
#     """Test deleting a non-existent item."""
#     response = await client.delete("/items/999")
#
#     assert response.status_code == 404
#     assert response.json()["detail"] == "Item not found"
