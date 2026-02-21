from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.media_generator import generate_comic_image

router = APIRouter()


class ComicGenerateRequest(BaseModel):
    # The text the user highlighted/selected in the editor
    selected_text: str


@router.post("/scripts/{script_id}/generate-comic")
async def generate_comic(script_id: str, request: ComicGenerateRequest):
    """
    Accepts selected script text and returns a comic-style image (base64 PNG).
    The script_id is kept for future use (e.g., linking generated art to a script).
    """
    if not request.selected_text.strip():
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")

    # Delegate to the Imagen 4.0 service
    result = await generate_comic_image(request.selected_text)

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])

    return result
