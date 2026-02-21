"""
Test script for the comic image generation feature.
Tests the media_generator service directly (no server needed).
Run: uv run python tests/test_comic_generator.py
"""
import asyncio
import sys
import os
import base64

# Add parent dir to path so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.media_generator import generate_comic_image, _build_comic_prompt


def test_prompt_builder():
    """Verify the comic prompt template produces expected output."""
    text = "Arjun stood at the edge of the cliff, sword gleaming."
    prompt = _build_comic_prompt(text)

    # Should contain comic-style keywords
    assert "Comic book" in prompt, "Prompt missing 'Comic book' style prefix"
    assert "Arjun" in prompt, "Prompt missing the original character name"
    assert "cliff" in prompt, "Prompt missing scene details from input"
    print("[PASS] Prompt builder generates correct comic-style prompt")
    print(f"  -> Prompt: {prompt[:100]}...")


def test_prompt_truncation():
    """Verify very long text gets capped at 500 chars."""
    long_text = "A" * 1000
    prompt = _build_comic_prompt(long_text)

    # The scene portion should be capped at 500 chars
    assert "A" * 1000 not in prompt, "Prompt did NOT truncate long input"
    print("[PASS] Long text correctly truncated to 500 chars")


async def test_image_generation():
    """Hit the actual Imagen 4.0 API and verify we get a base64 image back."""
    test_text = (
        "Arjun stood at the edge of the cliff, his sword gleaming "
        "under the blood-red sunset as the enemy army marched below."
    )

    print("\n[TEST] Calling Imagen 4.0 API (this may take 5-15 seconds)...")
    result = await generate_comic_image(test_text)

    # Check response structure
    if result["status"] == "error":
        print(f"[FAIL] API returned error: {result['message']}")
        return False

    assert result["status"] == "success", f"Unexpected status: {result['status']}"
    assert "image_base64" in result, "Response missing image_base64 field"
    assert "prompt_used" in result, "Response missing prompt_used field"
    assert "source_text" in result, "Response missing source_text field"

    # Verify the base64 string is valid
    image_bytes = base64.b64decode(result["image_base64"])
    assert len(image_bytes) > 1000, "Image too small — likely not a real image"

    # Save the image to disk so user can visually verify
    output_path = os.path.join(os.path.dirname(__file__), "test_comic_output.png")
    with open(output_path, "wb") as f:
        f.write(image_bytes)

    print(f"[PASS] Image generated successfully ({len(image_bytes)} bytes)")
    print(f"  -> Saved to: {output_path}")
    print(f"  -> Prompt used: {result['prompt_used'][:80]}...")
    return True


async def test_empty_text():
    """Verify empty text is rejected gracefully."""
    result = await generate_comic_image("")
    assert result["status"] == "error", "Empty text should return error"
    print("[PASS] Empty text correctly rejected")


async def main():
    print("=" * 60)
    print("  Comic Image Generator — Test Suite")
    print("=" * 60)

    # 1. Offline tests (no API call)
    print("\n--- Offline Tests (no API needed) ---")
    test_prompt_builder()
    test_prompt_truncation()
    await test_empty_text()

    # 2. Online test (calls Imagen 4.0 — needs GEMINI_API_KEY)
    print("\n--- Online Test (calls Imagen 4.0 API) ---")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[SKIP] GEMINI_API_KEY not set in .env — skipping API test")
    else:
        await test_image_generation()

    print("\n" + "=" * 60)
    print("  All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
