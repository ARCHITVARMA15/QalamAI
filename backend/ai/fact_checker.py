"""
RAG-based Fact Checker — uses the Knowledge Graph as a retrieval source.

Pipeline:
1. Extract entities from the user's query using spaCy NER
2. Retrieve matching nodes + edges from the story bible (MongoDB)
3. Format the retrieved subgraph as structured facts
4. Pass the focused context + query to Groq for verification

This replaces the naive "dump entire story bible" approach with targeted
entity-aware retrieval for more accurate fact checking.
"""

import os
import spacy
from groq import AsyncGroq
from dotenv import load_dotenv
from config.db import get_database

load_dotenv()

# ── Dedicated Groq client for fact checking ──────────────────────────────────
API_KEY = os.getenv("GROQ_API_KEY")
try:
    client = AsyncGroq(api_key=API_KEY)
except Exception as e:
    print(f"Warning: Failed to initialize Groq fact-checker client: {e}")
    client = None

# ── spaCy model for entity extraction ────────────────────────────────────────
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Warning: spaCy model 'en_core_web_sm' not found for fact checker.")
    nlp = None

VALID_ENTITY_LABELS = {"PERSON", "GPE", "LOC", "FAC", "ORG", "DATE", "EVENT", "NORP", "WORK_OF_ART"}


# ═════════════════════════════════════════════════════════════════════════════
# Step 1 — Extract entities from the user's query
# ═════════════════════════════════════════════════════════════════════════════

def extract_query_entities(text: str) -> list[str]:
    """
    Use spaCy NER to pull out character names, locations, dates, orgs, etc.
    from the user's chat message so we know what to look up in the graph.
    """
    if not nlp:
        return []

    doc = nlp(text)
    entities = set()
    for ent in doc.ents:
        if ent.label_ in VALID_ENTITY_LABELS:
            entities.add(ent.text.strip())

    # Also grab proper nouns that spaCy might miss (common with character names)
    for token in doc:
        if token.pos_ == "PROPN" and len(token.text) > 1:
            entities.add(token.text.strip())

    return list(entities)


# ═════════════════════════════════════════════════════════════════════════════
# Step 2 — Retrieve relevant facts from the knowledge graph
# ═════════════════════════════════════════════════════════════════════════════

async def retrieve_facts_from_graph(script_id: str, query_entities: list[str]) -> dict:
    """
    Query MongoDB story_bibles for the given script, then filter
    nodes and links to only those mentioning the query entities.
    Returns a structured dict of relevant nodes and links.
    """
    db = get_database()
    bible = await db["story_bibles"].find_one({"script_id": script_id})

    if not bible:
        return {"nodes": [], "links": [], "matched_entities": []}

    all_nodes = bible.get("nodes", [])
    all_links = bible.get("links", [])

    # Find nodes whose ID fuzzy-matches any query entity
    matched_node_ids = set()
    matched_nodes = []

    for node in all_nodes:
        node_id = node.get("id", "")
        for query_ent in query_entities:
            # Case-insensitive substring match (handles "Arjun" matching "arjun")
            if query_ent.lower() in node_id.lower() or node_id.lower() in query_ent.lower():
                matched_node_ids.add(node_id)
                matched_nodes.append(node)
                break

    # If no specific entities found, return the full graph (fallback)
    if not matched_node_ids:
        return {
            "nodes": all_nodes,
            "links": all_links,
            "matched_entities": query_entities,
            "retrieval_mode": "full_graph_fallback"
        }

    # Retrieve all links where source or target matches a found entity
    matched_links = []
    for link in all_links:
        src = link.get("source", "")
        tgt = link.get("target", "")
        if src in matched_node_ids or tgt in matched_node_ids:
            matched_links.append(link)
            # Also pull in the connected entity's node (1-hop neighbors)
            connected_id = tgt if src in matched_node_ids else src
            if connected_id not in matched_node_ids:
                matched_node_ids.add(connected_id)
                # Find and add the neighbor node
                for node in all_nodes:
                    if node.get("id") == connected_id:
                        matched_nodes.append(node)
                        break

    return {
        "nodes": matched_nodes,
        "links": matched_links,
        "matched_entities": list(matched_node_ids),
        "retrieval_mode": "entity_targeted"
    }


# ═════════════════════════════════════════════════════════════════════════════
# Step 3 — Format retrieved facts into structured context for LLM
# ═════════════════════════════════════════════════════════════════════════════

def format_facts_for_llm(retrieved: dict) -> str:
    """
    Turn the retrieved nodes/links into a clean, structured text block
    that the LLM can easily reference for fact checking.
    Limits output size to prevent Groq token limits (which max out around 12k TPM).
    """
    nodes = retrieved.get("nodes", [])
    links = retrieved.get("links", [])
    matched = retrieved.get("matched_entities", [])
    mode = retrieved.get("retrieval_mode", "entity_targeted")

    if not nodes and not links:
        return "NO FACTS FOUND — The Story Bible contains no data for this script yet."

    # Prevent massive graphs from blowing up the token count
    # Especially important during "full_graph_fallback"
    MAX_NODES = 50
    MAX_LINKS = 100

    sections = []

    # Header showing what was retrieved
    if mode == "entity_targeted":
        sections.append(f"RETRIEVED FACTS FOR: {', '.join(matched)}")
        sections.append(f"({len(nodes)} entities, {len(links)} relationships found)\n")
    else:
        sections.append("FULL STORY BIBLE (Truncated to top entries)")
        sections.append("(No specific entity match in query — showing available facts)\n")

    # Format entities with their types and scene appearances
    if nodes:
        sections.append("KNOWN ENTITIES:")
        for n in nodes[:MAX_NODES]:
            entity_type = n.get("type", "Entity")
            mentions = n.get("mentions", [])
            count = n.get("count", 1)
            # Truncate mentions if there are too many (e.g. ['scene_1', 'scene_2', ...])
            mentions_preview = mentions[:5]
            if len(mentions) > 5:
                mentions_preview.append("...")
            scene_info = f" [Appears in: {', '.join(mentions_preview)}]" if mentions_preview else ""
            sections.append(f"  • {n['id']} ({entity_type}, {count} mention{'s' if count != 1 else ''}){scene_info}")
        if len(nodes) > MAX_NODES:
            sections.append(f"  • ... (and {len(nodes) - MAX_NODES} more entities)")

    # Format relationships with their source sentences — this is the key evidence
    if links:
        sections.append("\nESTABLISHED FACTS (from the text):")
        seen_sentences = set()  # Deduplicate
        rendered_links = 0
        
        for link in links:
            if rendered_links >= MAX_LINKS:
                sections.append(f"  • ... (and {len(links) - MAX_LINKS} more relationships)")
                break
                
            src = link.get("source", "?")
            tgt = link.get("target", "?")
            rel = link.get("relation", "related to")
            sentence = link.get("sentence", "")

            # Show the relationship
            fact_line = f"  • {src} [{rel}] {tgt}"

            # Show the original source sentence as evidence (deduped)
            if sentence and sentence not in seen_sentences:
                # Truncate extremely long sentences
                safe_sentence = sentence if len(sentence) < 300 else sentence[:300] + "..."
                fact_line += f'\n    Evidence: "{safe_sentence}"'
                seen_sentences.add(sentence)

            sections.append(fact_line)
            rendered_links += 1

    return "\n".join(sections)


# ═════════════════════════════════════════════════════════════════════════════
# Step 4 — Full RAG fact-check pipeline
# ═════════════════════════════════════════════════════════════════════════════

FACT_CHECK_SYSTEM = (
    "You are Kalam Fact Checker — a rigorous narrative consistency auditor.\n\n"
    "You have been provided with RETRIEVED FACTS from the project's Story Bible (Knowledge Graph). "
    "These are the established, canonical facts about characters, locations, events, and relationships.\n\n"
    "Your job:\n"
    "1. Break down complex claims into their core components (e.g., the Action/Event AND the Reason/Causality).\n"
    "2. Cross-reference ALL parts of the user's text against the RETRIEVED FACTS below.\n"
    "3. Determine if both the WHAT (the event) and the WHY (the reason/motivation) MATCH, CONTRADICT, or CANNOT BE VERIFIED.\n"
    "4. Cite the specific evidence from the Retrieved Facts when confirming or contradicting.\n\n"
    "IMPORTANT CAUSALITY CHECK:\n"
    "If the event is true but the stated reason/motivation is NOT supported by the Story Bible or contradicts it, "
    "you MUST flag the reasoning part as UNVERIFIABLE or a CONTRADICTION.\n\n"
    "Format:\n"
    "✅ VERIFIED: [claim] — matches [cited evidence]\n"
    "❌ CONTRADICTION: [claim] — conflicts with [cited evidence]\n"
    "⚠️ UNVERIFIABLE: [claim] — no matching data in the Story Bible\n\n"
    "Be precise. Quote the evidence. Break down the response if one part of a claim is verified but another is not.\n"
)


async def fact_check_with_rag(
    user_message: str,
    script_id: str,
    editor_content: str = "",
    conversation_history: list = None,
    programmatic_flags: list = None,
) -> str:
    """
    Full RAG pipeline for fact checking:
    1. Extract entities from user message + editor content
    2. Retrieve relevant facts from knowledge graph
    3. Format context and send to Groq for verification
    4. Incorporate programmatic flags from the logic engine
    """
    if not client:
        return "Groq API client is not initialized. Check GROQ_API_KEY in .env"

    # Step 1: Extract entities from both the user's question and the editor content
    query_text = user_message
    if editor_content:
        # Also scan the editor content for entities to widen retrieval
        query_text += " " + editor_content[:2000]

    query_entities = extract_query_entities(query_text)

    # Step 2: Retrieve relevant facts from the knowledge graph
    retrieved = await retrieve_facts_from_graph(script_id, query_entities)

    # Step 3: Format for LLM
    facts_context = format_facts_for_llm(retrieved)

    # Build the full system prompt with retrieved facts
    system_prompt = FACT_CHECK_SYSTEM + f"\n--- RETRIEVED FACTS ---\n{facts_context}\n--- END RETRIEVED FACTS ---\n"

    if editor_content:
        safe_content = editor_content[:3000]
        system_prompt += f"\n--- CURRENT EDITOR CONTENT ---\n{safe_content}\n--- END EDITOR CONTENT ---\n"

    if programmatic_flags:
        system_prompt += "\n--- EXISTING LOGIC ENGINE FLAGS ---\nThe system's rule-based contradiction detector also flagged these specific issues:\n"
        for flag in programmatic_flags:
            system_prompt += f"- [{flag.get('reason_tag', 'ERROR')}] {flag.get('reason_detail', '')}\n"
        system_prompt += "Make sure to acknowledge and incorporate these programmatic flags into your final response.\n--- END LOGIC ENGINE FLAGS ---\n"

    # Build messages
    formatted_messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        for msg in conversation_history[:-1]:  # All but the last (we add it separately)
            formatted_messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })

    formatted_messages.append({"role": "user", "content": user_message})

    # Step 4: Call Groq
    try:
        response = await client.chat.completions.create(
            messages=formatted_messages,
            model="llama-3.1-8b-instant",
            temperature=0.2,  # Low temp for precise, factual responses
            max_tokens=1500,
            top_p=1,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Fact-checker Groq error: {e}")
        return f"Error during fact checking: {str(e)}"
