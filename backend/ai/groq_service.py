import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

# Initialize the async Groq client
try:
    client = AsyncGroq(api_key=API_KEY)
except Exception as e:
    print(f"Warning: Failed to initialize Groq client: {e}")
    client = None

async def generate_chat_reply(messages: list, context: str = "", story_bible: str = "", mode: str = "Standard") -> str:
    """
    Generate a chat reply from Groq based on conversation history and context.
    Mode controls the persona: Standard (helpful assistant), Advanced (deeper analysis),
    or Fact Check (rigorous fact-checker against the story bible).
    """
    if not client:
        return "Groq API client is not initialized. Please ensure GROQ_API_KEY is legally set in .env"
    
    # Build system prompt based on the selected mode
    if mode == "Fact Check":
        system_prompt = (
            "You are Kalam Fact Checker — a rigorous narrative consistency auditor. "
            "Your ONLY job is to fact-check the user's text against the Story Bible provided below. "
            "For every claim, character trait, timeline reference, or relationship mentioned:\n"
            "1. Cross-reference it against the Story Bible\n"
            "2. Flag any contradictions, timeline errors, or character inconsistencies\n"
            "3. Cite the specific conflicting fact from the Story Bible\n"
            "4. If something cannot be verified, say so clearly\n\n"
            "Format your response clearly with ✅ for verified facts, ❌ for contradictions, "
            "and ⚠️ for unverifiable claims. Be precise and concise.\n"
        )
    else:
        # Standard and Advanced both use the helpful assistant prompt
        system_prompt = (
            "You are an AI writing assistant for Kalam, an app for screenwriters and authors. "
            "Your goal is to be helpful, concise, and provide actionable advice based on the user's project context.\n"
        )
    
    if story_bible:
        system_prompt += f"\nBelow is the active Story Bible (Knowledge Graph) for this script. Use this to maintain continuity and provide deeply contextual suggestions:\n{story_bible}\n"

    if context:
        # Keep context to a reasonable length to avoid token limits
        safe_context = context[:4000]
        system_prompt += f"\nHere is the current context/content of the user's project:\n{safe_context}\n"
        
    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    # Map frontend messages to Groq's expected format
    for msg in messages:
        formatted_messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })

    try:
        response = await client.chat.completions.create(
            messages=formatted_messages,
            model="llama-3.3-70b-versatile",
            temperature=0.3 if mode == "Fact Check" else 0.7,
            max_tokens=1024,
            top_p=1,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return "Sorry, I ran into an error generating a response. Please try again."
