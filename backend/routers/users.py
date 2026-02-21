from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db_helpers import insert_document, find_by_id
from datetime import datetime

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    preferred_language: str = "en"

@router.post("/register")
async def register_user(user: UserCreate):
    new_user = {
        "username": user.username,
        "email": user.email,
        "hashed_password": f"hashed_{user.password}", # Mock hashing for now
        "preferred_language": user.preferred_language,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    user_id = await insert_document("users", new_user)
    return {"status": "success", "user_id": user_id, "message": "User registered successfully"}

@router.get("/me")
async def get_current_user(user_id: str):
    # In a real app, user_id comes from a JWT token dependency
    user = await find_by_id("users", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user