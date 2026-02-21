"""
AI Writing Tools — Groq-powered handlers for all editor AI actions.

Each action (write, rewrite, describe, brainstorm, tone, shorten, expand, summarize)
gets its own async function with a task-specific system prompt. A single dispatcher
`handle_ai_action()` routes incoming requests to the correct handler.

Uses its own AsyncGroq client instance (separate from groq_service.py chat client).
Model: llama-3.3-70b-versatile via Groq inference.
"""

import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

# ── Dedicated Groq client for writing tools ─────────────────────────────────
API_KEY = os.getenv("GROQ_API_KEY")

try:
    client = AsyncGroq(api_key=API_KEY)
except Exception as e:
    print(f"Warning: Failed to initialize Groq writing-tools client: {e}")
    client = None

MODEL = "llama-3.3-70b-versatile"

# ── Base system prompt shared by all actions ─────────────────────────────────
BASE_SYSTEM = (
    "You are Kalam AI — a writing assistant for screenwriters and long-form content creators. "
    "You produce high-quality, publishable prose. Keep your output clean — no markdown formatting, "
    "no bullet points, no headers. Just pure narrative text unless specifically asked otherwise.\n"
)


# ── Utility: count words in a string ─────────────────────────────────────────
def _word_count(text: str) -> int:
    """Count words in a string, stripping whitespace."""
    return len(text.split()) if text and text.strip() else 0


# ── Helper: call Groq with action-specific prompts ──────────────────────────
async def _call_groq(system_prompt: str, user_prompt: str, temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """
    Low-level wrapper around the Groq chat completion API.
    Returns the raw text response or an error message.
    """
    if not client:
        return "Groq API client is not initialized. Check GROQ_API_KEY in .env"

    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            model=MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=1,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Groq writing-tools error: {e}")
        return f"Error generating response: {str(e)}"


# ═════════════════════════════════════════════════════════════════════════════
# Action Handlers — each returns a dict matching frontend AIResponse interface
# ═════════════════════════════════════════════════════════════════════════════


async def ai_write(content: str, context: str = "", genre: str = "") -> dict:
    """
    Continue writing from where the user left off.
    Uses the existing content as context to maintain voice and narrative flow.
    """
    system = BASE_SYSTEM + (
        "TASK: Continue writing from where the user's text ends. "
        "Match the existing tone, style, and narrative voice. "
        "Write 2-4 natural paragraphs that flow seamlessly from the last line. "
        "Do NOT repeat or summarize what came before — just continue forward.\n"
    )
    if genre:
        system += f"Genre: {genre}\n"

    # Use the last ~2000 chars as immediate context for continuation
    tail = content[-2000:] if len(content) > 2000 else content
    user_msg = f"Continue writing from here:\n\n{tail}" if tail.strip() else "Write an opening paragraph for a new story."

    result = await _call_groq(system, user_msg, temperature=0.8, max_tokens=1024)

    # Compute how many words and paragraphs were generated
    new_words = _word_count(result)
    new_paragraphs = len([p for p in result.split("\n") if p.strip()])

    return {
        "result": result,
        "changes": [
            {"type": "structure", "description": f"Added {new_words} new words across {new_paragraphs} paragraph{'s' if new_paragraphs != 1 else ''}"},
            {"type": "flow", "description": "Matched existing tone and narrative voice for seamless continuation"},
        ],
    }


async def ai_rewrite(content: str, context: str = "", genre: str = "") -> dict:
    """
    Rewrite the selected text — improve clarity, flow, and impact while
    keeping the original meaning intact.
    """
    system = BASE_SYSTEM + (
        "TASK: Rewrite the given text to improve clarity, flow, and impact. "
        "Preserve the original meaning and key details. "
        "Make it tighter, more vivid, and better paced. "
        "Return ONLY the rewritten text — no commentary or explanation.\n"
    )
    if genre:
        system += f"Genre: {genre}\n"

    # Provide surrounding context so the rewrite stays consistent
    user_msg = f"Rewrite this passage:\n\n{content}"
    if context:
        user_msg += f"\n\nSurrounding context for reference:\n{context[:1000]}"

    result = await _call_groq(system, user_msg, temperature=0.6)

    # Compute before/after metrics for visible feedback
    original_words = _word_count(content)
    rewritten_words = _word_count(result)
    diff = rewritten_words - original_words
    diff_label = f"{abs(diff)} words {'added' if diff > 0 else 'trimmed'}" if diff != 0 else "same length"

    return {
        "result": result,
        "changes": [
            {"type": "clarity", "description": f"Rewrote {original_words} words → {rewritten_words} words ({diff_label})"},
            {"type": "flow", "description": "Restructured sentence rhythm for better pacing and impact"},
        ],
    }


async def ai_describe(content: str, context: str = "", genre: str = "") -> dict:
    """
    Generate a rich, sensory description that fits the current scene or context.
    """
    system = BASE_SYSTEM + (
        "TASK: Write a vivid, sensory-rich description paragraph. "
        "Use concrete details — sights, sounds, smells, textures, movement. "
        "Ground the reader in the scene without over-writing. "
        "Return ONLY the descriptive passage.\n"
    )
    if genre:
        system += f"Genre: {genre}\n"

    if content.strip():
        user_msg = f"Write a vivid description for this scene/context:\n\n{content[-1500:]}"
    else:
        user_msg = "Write an atmospheric opening description for a story scene."

    result = await _call_groq(system, user_msg, temperature=0.8, max_tokens=800)

    # Count generated words for visible feedback
    desc_words = _word_count(result)

    return {
        "result": result,
        "changes": [
            {"type": "clarity", "description": f"Generated {desc_words}-word descriptive passage with sensory details"},
            {"type": "flow", "description": "Wove in sights, sounds, textures, and atmosphere"},
        ],
    }


async def ai_brainstorm(content: str, context: str = "", genre: str = "") -> dict:
    """
    Generate 5 creative story direction ideas based on the current content.
    Returns as `suggestions` array (not `result`) to trigger the chip UI.
    """
    system = BASE_SYSTEM + (
        "TASK: Generate exactly 5 creative, actionable story ideas or plot directions. "
        "Each idea should be 1-2 sentences — punchy and specific, not generic. "
        "Return them as a JSON array of 5 strings. Example:\n"
        '[\"Idea one.\", \"Idea two.\", \"Idea three.\", \"Idea four.\", \"Idea five.\"]\n'
        "Return ONLY the JSON array, no other text.\n"
    )
    if genre:
        system += f"Genre: {genre}\n"

    tail = content[-1500:] if content.strip() else ""
    user_msg = f"Brainstorm ideas based on this:\n\n{tail}" if tail else "Brainstorm 5 fresh story opening ideas."

    raw = await _call_groq(system, user_msg, temperature=0.9, max_tokens=600)

    # Parse the JSON array from the response
    suggestions = _parse_suggestions(raw)

    # Count how many ideas and the context size for visible feedback
    context_words = _word_count(content) if content.strip() else 0

    return {
        "result": "",
        "suggestions": suggestions,
        "changes": [
            {"type": "structure", "description": f"Generated {len(suggestions)} story ideas from {context_words} words of context"},
        ],
    }


async def ai_tone(content: str, tone: str = "formal", context: str = "", genre: str = "") -> dict:
    """
    Transform the writing style/tone of the given text.
    Replaces the broken T5-small style transformer with Groq.
    Also asks the model to report specific vocabulary swaps for transparency.
    """
    system = BASE_SYSTEM + (
        f"TASK: Transform the following text into a {tone} tone/style. "
        "Keep the same meaning and key plot points, but shift the voice, vocabulary, "
        "and sentence structure to match the requested tone.\n\n"
        "Return your response as JSON with this exact structure:\n"
        '{"text": "<the transformed text>", "swaps": ["word1 → replacement1", "word2 → replacement2", ...]}\n'
        "List up to 8 of the most significant vocabulary/phrasing changes in 'swaps'.\n"
        "Return ONLY the JSON object.\n"
    )

    user_msg = f"Transform this text to {tone} tone:\n\n{content}"

    raw = await _call_groq(system, user_msg, temperature=0.6)

    # Parse structured response for text + swaps
    result_text, swaps = _parse_tone_response(raw, content)

    original_words = _word_count(content)
    new_words = _word_count(result_text)

    changes = [
        {"type": "tone", "description": f"Transformed {original_words} words to {tone} tone ({new_words} words after)"},
    ]
    # Show specific word swaps so the user can see what vocabulary shifted
    if swaps:
        swap_preview = ", ".join(swaps[:5])
        changes.append({"type": "clarity", "description": f"Key changes: {swap_preview}"})

    return {
        "result": result_text,
        "changes": changes,
    }


async def ai_shorten(content: str, context: str = "", genre: str = "") -> dict:
    """
    Make the text more concise — cut filler, tighten sentences,
    keep the core meaning.
    """
    system = BASE_SYSTEM + (
        "TASK: Make this text significantly shorter and more concise. "
        "Remove filler words, redundant phrases, and unnecessary detail. "
        "Keep the core meaning and important beats intact. "
        "Aim for roughly 40-60% of the original length. "
        "Return ONLY the shortened text.\n"
    )

    user_msg = f"Shorten this:\n\n{content}"

    result = await _call_groq(system, user_msg, temperature=0.4, max_tokens=800)

    # Compute reduction metrics for visible feedback
    original_words = _word_count(content)
    shortened_words = _word_count(result)
    words_cut = original_words - shortened_words
    pct = round((words_cut / original_words) * 100) if original_words > 0 else 0

    return {
        "result": result,
        "changes": [
            {"type": "structure", "description": f"Reduced from {original_words} → {shortened_words} words ({words_cut} words cut, {pct}% shorter)"},
            {"type": "clarity", "description": "Removed filler, redundancies, and tightened sentence structure"},
        ],
    }


async def ai_expand(content: str, context: str = "", genre: str = "") -> dict:
    """
    Expand the text — add detail, depth, and nuance while preserving voice.
    """
    system = BASE_SYSTEM + (
        "TASK: Expand and enrich this text with more detail, depth, and nuance. "
        "Add sensory details, inner thoughts, or atmospheric elements as appropriate. "
        "Keep the original voice and style consistent. "
        "Aim for roughly 150-200% of the original length. "
        "Return ONLY the expanded text.\n"
    )
    if genre:
        system += f"Genre: {genre}\n"

    user_msg = f"Expand this:\n\n{content}"
    if context:
        user_msg += f"\n\nSurrounding context:\n{context[:1000]}"

    result = await _call_groq(system, user_msg, temperature=0.7, max_tokens=1500)

    # Compute expansion metrics for visible feedback
    original_words = _word_count(content)
    expanded_words = _word_count(result)
    words_added = expanded_words - original_words
    pct = round((words_added / original_words) * 100) if original_words > 0 else 0

    return {
        "result": result,
        "changes": [
            {"type": "structure", "description": f"Expanded from {original_words} → {expanded_words} words (+{words_added} words, +{pct}%)"},
            {"type": "clarity", "description": "Added sensory details, depth, and narrative texture"},
        ],
    }


async def ai_summarize(content: str, context: str = "", genre: str = "") -> dict:
    """
    Summarize the content into a clear, concise overview.
    """
    system = BASE_SYSTEM + (
        "TASK: Summarize the following text into a clear, concise overview. "
        "Capture the key events, characters, and themes in 2-4 sentences. "
        "Write it as prose, not bullet points. "
        "Return ONLY the summary.\n"
    )

    user_msg = f"Summarize this:\n\n{content}"

    result = await _call_groq(system, user_msg, temperature=0.3, max_tokens=400)

    # Compute reduction metrics for visible feedback
    original_words = _word_count(content)
    summary_words = _word_count(result)
    words_reduced = original_words - summary_words
    pct = round((words_reduced / original_words) * 100) if original_words > 0 else 0

    return {
        "result": result,
        "changes": [
            {"type": "structure", "description": f"Distilled {original_words} words → {summary_words}-word summary ({pct}% reduction)"},
            {"type": "flow", "description": "Captured key events, characters, and themes"},
        ],
    }


# ═════════════════════════════════════════════════════════════════════════════
# Dispatcher — routes action string to the correct handler
# ═════════════════════════════════════════════════════════════════════════════

# Map action names to their handler functions
_ACTION_MAP = {
    "write": ai_write,
    "rewrite": ai_rewrite,
    "describe": ai_describe,
    "brainstorm": ai_brainstorm,
    "tone": ai_tone,
    "shorten": ai_shorten,
    "expand": ai_expand,
    "summarize": ai_summarize,
}


async def handle_ai_action(action: str, content: str, context: str = "", tone: str = "", genre: str = "") -> dict:
    """
    Central dispatcher — looks up the action and calls its handler.
    Returns dict matching the frontend AIResponse interface.
    """
    handler = _ACTION_MAP.get(action)
    if not handler:
        return {"result": f"Unknown action: {action}", "changes": []}

    # Tone action needs the tone parameter passed through
    if action == "tone":
        return await handler(content, tone=tone or "formal", context=context, genre=genre)

    return await handler(content, context=context, genre=genre)


# ── Utility: parse tone response with vocabulary swaps ──────────────────────
def _parse_tone_response(raw: str, fallback_text: str) -> tuple:
    """
    Parse the structured JSON response from the tone handler.
    Returns (transformed_text, list_of_swaps).
    Falls back gracefully if the model doesn't return valid JSON.
    """
    import re

    # Try direct JSON parse
    try:
        parsed = json.loads(raw.strip())
        if isinstance(parsed, dict):
            text = parsed.get("text", raw)
            swaps = parsed.get("swaps", [])
            return text, [str(s) for s in swaps]
    except json.JSONDecodeError:
        pass

    # Fallback: try to extract JSON object from within the response
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            text = parsed.get("text", raw)
            swaps = parsed.get("swaps", [])
            return text, [str(s) for s in swaps]
        except json.JSONDecodeError:
            pass

    # Last resort: return raw text with no swaps
    return raw, []


# ── Utility: parse brainstorm suggestions from LLM JSON output ──────────────
def _parse_suggestions(raw: str) -> list:
    """
    Safely extract a list of suggestion strings from Groq's response.
    The model should return a JSON array, but we handle edge cases.
    """
    # Try parsing as raw JSON first
    try:
        parsed = json.loads(raw.strip())
        if isinstance(parsed, list):
            return [str(item) for item in parsed[:7]]
    except json.JSONDecodeError:
        pass

    # Fallback: extract JSON array from within the response text
    import re
    match = re.search(r'\[.*?\]', raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return [str(item) for item in parsed[:7]]
        except json.JSONDecodeError:
            pass

    # Last resort: split by newlines and filter blanks
    lines = [line.strip().lstrip("0123456789.-) ") for line in raw.strip().split("\n") if line.strip()]
    return lines[:5] if lines else ["No suggestions generated. Try again with more context."]
