from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from ai.media_generator import generate_comic_image
from ai.flow import orchestrate_comic_strip, generate_comic_pdf

router = APIRouter()


class ComicGenerateRequest(BaseModel):
    # The text the user highlighted/selected in the editor
    selected_text: str


class ComicStripRequest(BaseModel):
    # Text selection for multi-panel comic strip
    selected_text: str
    max_panels: int = 6  # Cap at 6 panels by default


class ComicPdfRequest(BaseModel):
    # Panels with base64 images to compile into a PDF
    panels: list[dict]
    title: Optional[str] = "Kalam Comic Strip"


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


@router.post("/scripts/{script_id}/generate-comic-strip")
async def generate_comic_strip(script_id: str, request: ComicStripRequest):
    """
    Generate a multi-panel comic strip from selected text.
    Splits the text into scene chunks and generates one image per chunk.
    Returns all panels with base64 images and metadata.
    """
    if not request.selected_text.strip():
        raise HTTPException(status_code=400, detail="Selected text cannot be empty")

    result = await orchestrate_comic_strip(
        selected_text=request.selected_text,
        script_id=script_id,
        max_panels=request.max_panels,
    )

    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result.get("message", "Comic strip generation failed"))

    return result


@router.post("/scripts/{script_id}/comic-pdf")
async def create_comic_pdf(script_id: str, request: ComicPdfRequest):
    """
    Generate a downloadable PDF from an array of comic panel images.
    Receives base64 images and returns a PDF binary response.
    """
    if not request.panels:
        raise HTTPException(status_code=400, detail="No panels provided")

    try:
        pdf_bytes = generate_comic_pdf(request.panels, title=request.title or "Kalam Comic Strip")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="kalam-comic-strip.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
