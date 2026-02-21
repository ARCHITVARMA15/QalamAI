# backend/config/db_helpers.py
from bson import ObjectId
from datetime import datetime
from config.db import get_database


def object_id_to_str(document: dict) -> dict:
    """MongoDB uses ObjectId for _id — convert to string for JSON responses."""
    if document and "_id" in document:
        document["_id"] = str(document["_id"])
    return document


async def insert_document(collection_name: str, data: dict) -> str:
    """Insert a document into a collection and return its new ID."""
    db = get_database()
    result = await db[collection_name].insert_one(data)
    return str(result.inserted_id)


async def find_by_id(collection_name: str, doc_id: str) -> dict | None:
    """Fetch a single document by its ID."""
    db = get_database()
    doc = await db[collection_name].find_one({"_id": ObjectId(doc_id)})
    return object_id_to_str(doc) if doc else None


async def find_many(collection_name: str, query: dict) -> list:
    """Fetch all documents matching a query."""
    db = get_database()
    cursor = db[collection_name].find(query)
    results = await cursor.to_list(length=100)
    return [object_id_to_str(doc) for doc in results]


async def update_document(collection_name: str, doc_id: str, updates: dict) -> bool:
    """Update a document by ID. Automatically updates the timestamp."""
    db = get_database()
    updates["updated_at"] = datetime.utcnow()
    result = await db[collection_name].update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": updates}
    )
    return result.modified_count > 0


async def delete_document(collection_name: str, doc_id: str) -> bool:
    """Delete a document by ID."""
    db = get_database()
    result = await db[collection_name].delete_one({"_id": ObjectId(doc_id)})
    return result.deleted_count > 0