# backend/config/db.py

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, TEXT
import os
from dotenv import load_dotenv

# Load the .env file so MONGODB_URL and DATABASE_NAME are available
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kalam_db")

# Single global client — created once, reused across all requests
client: AsyncIOMotorClient = None


async def connect_db():
    """Called once when FastAPI starts — opens the DB connection."""
    global client
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    print(f"[OK] Connected to MongoDB: {DATABASE_NAME}")
    await create_indexes(db)


async def close_db():
    """Called once when FastAPI shuts down — closes the connection cleanly."""
    global client
    if client:
        client.close()
        print("[INFO] MongoDB connection closed.")


def get_database():
    """Returns the active database — imported by any service that needs DB access."""
    return client[DATABASE_NAME]


async def create_indexes(db):
    """
    Indexes make queries fast — without them MongoDB scans every document.
    These run on startup and are safe to re-run (MongoDB skips if they exist).
    """
    await db["users"].create_index([("email", ASCENDING)], unique=True)
    await db["projects"].create_index([("owner_id", ASCENDING)])
    await db["scripts"].create_index([("project_id", ASCENDING)])
    await db["scripts"].create_index([("content", TEXT)])
    await db["story_bibles"].create_index([("script_id", ASCENDING)])
    await db["contradictions"].create_index([("script_id", ASCENDING)])
    await db["enhancements"].create_index([("script_id", ASCENDING)])
    await db["style_fingerprints"].create_index([("user_id", ASCENDING)])
    print("[INFO] Indexes created successfully.")