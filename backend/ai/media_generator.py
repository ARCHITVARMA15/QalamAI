import os
import base64
import asyncio
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the Gemini client for Imagen 4.0 image generation
try:
    client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception as e:
    print(f"Warning: Failed to initialize Gemini client: {e}")
    client = None


def _build_comic_prompt(selected_text: str) -> str:
    """
    Converts raw script text into a comic-style image prompt.
    Keeps it template-based (no LLM call) for speed and predictability.
    """
    # Cap input length to avoid bloated prompts
    safe_text = selected_text[:500].strip()

    prompt = (
        "Comic book illustration style. Bold black ink outlines, vivid flat colors, "
        "dramatic panel composition, halftone dot shading, dynamic action poses. "
        "Speech bubbles are optional. "
        f"Illustrate this scene: {safe_text}"
    )
    return prompt


async def generate_comic_image(selected_text: str) -> dict:
    """
    Takes selected script text and generates a comic-style image via Imagen 4.0.

    Returns a dict with:
      - status: 'success' or 'error'
      - image_base64: base64-encoded PNG (on success)
      - prompt_used: the comic prompt sent to Imagen
      - source_text: the original selected text
    """
    if not client:
        return {
            "status": "error",
            "message": "Gemini API key not configured. Add GEMINI_API_KEY to .env"
        }

    if not selected_text or not selected_text.strip():
        return {
            "status": "error",
            "message": "No text provided for image generation"
        }

    comic_prompt = _build_comic_prompt(selected_text)

    try:
        # Run the synchronous Imagen call in a thread so FastAPI stays non-blocking
        response = await asyncio.to_thread(
            client.models.generate_images,
            model="imagen-4.0-generate-001",
            prompt=comic_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
            )
        )

        # Extract the first generated image
        if response.generated_images:
            image = response.generated_images[0].image
            # Encode raw image bytes to base64 for JSON-safe transport
            image_b64 = base64.b64encode(image.image_bytes).decode("utf-8")

            return {
                "status": "success",
                "image_base64": image_b64,
                "prompt_used": comic_prompt,
                "source_text": selected_text
            }
        else:
            return {
                "status": "error",
                "message": "Imagen returned no images. Try rephrasing the text."
            }

    except Exception as e:
        print(f"Error generating comic image: {e}")
        return {
            "status": "error",
            "message": f"Image generation failed: {str(e)}"
        }
