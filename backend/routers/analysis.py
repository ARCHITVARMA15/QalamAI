from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db_helpers import find_many, update_document, insert_document
from config.db import get_database

# Import our AI Engines
from services.knowledge_graph import KnowledgeGraphEngine
from services.contradiction_detector import ContradictionDetector
from services.persona_generator import PersonaGenerator
# from services.style_transformer import StyleTransformer
from services.enhancement_service import EnhancementService
from ai.groq_service import generate_chat_reply
from ai.writing_tools import handle_ai_action, ai_tweak_plot, ai_auto_suggest
from ai.fact_checker import fact_check_with_rag
from ai.flow import orchestrate_analysis

router = APIRouter()

# Initialize models once at startup (module level) to avoid reloading spaCy per request
kg_engine = None
detector = None
persona_gen = None
enhancement_service = None

try:
    kg_engine = KnowledgeGraphEngine()
except Exception as e:
    print(f"Error loading KnowledgeGraphEngine: {e}")

try:
    detector = ContradictionDetector()
except Exception as e:
    print(f"Error loading ContradictionDetector: {e}")

try:
    persona_gen = PersonaGenerator()
except Exception as e:
    print(f"Error loading PersonaGenerator: {e}")

try:
    enhancement_service = EnhancementService()
except Exception as e:
    print(f"Error loading EnhancementService: {e}")

class AnalyzeRequest(BaseModel):
    text: str

class PersonaRequest(BaseModel):
    content: str
    
class AIActionRequest(BaseModel):
    content: str
    tone: str = "formal"
    action: str = ""
    context: str = ""
    genre: str = ""

class ChatRequest(BaseModel):
    messages: list
    projectId: str
    scriptId: str = ""
    context: str = ""
    mode: str = "Standard"

class TweakPlotRequest(BaseModel):
    script_id: str
    original_text: str
    tweak_instruction: str

class AutoSuggestRequest(BaseModel):
    script_id: str
    recent_text: str  # Last ~500 words the user has typed

class OrchestrateRequest(BaseModel):
    text: str
    run_suggestions: bool = True
    user_message: str = ""  # Raw chat message — used as intent context for suggestions

@router.post("/scripts/{script_id}/analyze")
async def analyze_script(script_id: str, request: AnalyzeRequest):

    db = get_database()
    
    # 1. Fetch current graph to detect contradictions against
    existing_bible = await db["story_bibles"].find_one({"script_id": script_id})
    existing_nodes = existing_bible.get("nodes", []) if existing_bible else []
    existing_links = existing_bible.get("links", []) if existing_bible else []

    # 2. Contradiction Detection
    # Run the new text against the existing graph to find logic errors
    flags = detector.check_sentence(request.text, existing_nodes=existing_nodes, existing_links=existing_links)

    # 3. Knowledge Graph Update
    # Process the ENTIRE new text to extract entities and relationships (Stateless)
    graph_data = kg_engine.process_text(request.text, scene_id="current_scene")

    # 4. Merge the new graph data with the existing graph
    # Create dicts for faster lookup
    existing_nodes_dict = {n["id"]: n for n in existing_nodes}
    
    # Merge Nodes
    for new_node in graph_data.get("nodes", []):
        node_id = new_node["id"]
        if node_id in existing_nodes_dict:
            # Merge mentions if the node exists
            existing_mentions = set(existing_nodes_dict[node_id].get("mentions", []))
            new_mentions = set(new_node.get("mentions", []))
            existing_nodes_dict[node_id]["mentions"] = list(existing_mentions.union(new_mentions))
            existing_nodes_dict[node_id]["count"] = new_node.get("count", 1)
        else:
            existing_nodes_dict[node_id] = new_node
            
    merged_nodes = list(existing_nodes_dict.values())
    
    # Merge Links
    # To prevent duplicates, we uniquely identify a link by (source, target, relation)
    merged_links = list(existing_links)
    existing_links_set = {(link["source"], link["target"], link.get("relation", "")) for link in existing_links}
    
    for new_link in graph_data.get("links", []):
        link_signature = (new_link["source"], new_link["target"], new_link.get("relation", ""))
        if link_signature not in existing_links_set:
            merged_links.append(new_link)
            existing_links_set.add(link_signature)

    # 5. Save the merged Story Bible to MongoDB
    bible_data = {
        "script_id": script_id,
        "nodes": merged_nodes,
        "links": merged_links
    }
    
    await db["story_bibles"].update_one(
        {"script_id": script_id},
        {"$set": bible_data},
        upsert=True
    )

    # 4. Save any contradictions found
    saved_flags = []
    for flag in flags:
        new_contra = {
            "script_id": script_id,
            "sentence": flag.get("conflicting_sentence"),
            "conflict_with": flag.get("reason_detail"),
            "reason_tag": flag.get("reason_tag"),
            "resolved": False
        }
        contra_id = await insert_document("contradictions", new_contra)
        saved_flags.append(contra_id)

    return {
        "status": "success", 
        "message": "Analysis complete", 
        "script_id": script_id,
        "contradictions_found": len(saved_flags)
    }

@router.post("/scripts/{script_id}/orchestrate")
async def orchestrate_script(script_id: str, request: OrchestrateRequest):
    """
    Full analysis pipeline via flow.py orchestration.
    Runs KG build → contradiction detection → auto-suggestions in one call.
    Called after the user's first AI interaction on a script.
    Returns issues, suggestions, and KG stats for the alert system.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        result = await orchestrate_analysis(
            script_id=script_id,
            text=request.text,
            run_suggestions=request.run_suggestions,
            user_message=request.user_message,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scripts/{script_id}/story_bible")
async def get_story_bible(script_id: str):
    bibles = await find_many("story_bibles", {"script_id": script_id})
    if not bibles:
        return {"nodes": [], "links": []}
    return bibles[0]

@router.get("/scripts/{script_id}/contradictions")
async def get_contradictions(script_id: str):
    return await find_many("contradictions", {"script_id": script_id, "resolved": False})

@router.put("/contradictions/{contra_id}/resolve")
async def resolve_contradiction(contra_id: str):
    updated = await update_document("contradictions", contra_id, {"resolved": True})
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to resolve contradiction")
    return {"status": "success"}

@router.get("/scripts/{script_id}/enhancements")
async def get_enhancements(script_id: str):
    return await find_many("enhancements", {"script_id": script_id, "accepted": None})

@router.put("/enhancements/{enhance_id}/accept")
async def accept_enhancement(enhance_id: str):
    updated = await update_document("enhancements", enhance_id, {"accepted": True})
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update enhancement")
    return {"status": "success"}

@router.post("/scripts/{script_id}/personas")
async def extract_personas(script_id: str, request: PersonaRequest):
    """
    Generate character personas from text using the PersonaGenerator.
    """
    try:
        personas_data = persona_gen.generate_personas(request.content)
        # Note: We aren't saving to DB here per frontend needs, just returning the extraction
        return personas_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhance")
async def enhance_content(request: AIActionRequest):
    """
    Endpoint for sentence/paragraph logic/flow enhancement.
    """
    result = enhancement_service.enhance_paragraph(request.content)
    
    # Format to match frontend AIResponse interface
    return {
        "result": result["modified"],
        "changes": [
            {
                "type": tag["type"],
                "description": tag["detail"]
            } for tag in result["reason_tags"]
        ]
    }

# Tone transformation — routed through Groq
@router.post("/transform-style")
async def transform_style(request: AIActionRequest):
    result = await handle_ai_action("tone", request.content, tone=request.tone)
    return result


# ── Unified AI Action endpoint — handles write, rewrite, describe, etc. ──────
@router.post("/ai/action")
async def ai_action_endpoint(request: AIActionRequest):
    """
    Central endpoint for all AI writing actions.
    Dispatches to the Groq-powered handler based on request.action.
    """
    result = await handle_ai_action(
        action=request.action,
        content=request.content,
        context=request.context,
        tone=request.tone,
        genre=request.genre,
    )
    return result

# ── Plot Tweak — retroactive story change grounded in the Knowledge Graph ────
@router.post("/analysis/tweak-plot")
async def tweak_plot(request: TweakPlotRequest):
    """
    Rewrite a passage to incorporate a retroactive plot change.
    Uses the KG story bible to avoid introducing new contradictions.
    Returns the rewritten text, change metadata, and any contradiction warnings.
    """
    try:
        result = await ai_tweak_plot(
            content=request.original_text,
            instruction=request.tweak_instruction,
            script_id=request.script_id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Writing Mode — proactive consistency suggestions ──────────────────────────
@router.post("/analysis/auto-suggest-tweaks")
async def auto_suggest_tweaks(request: AutoSuggestRequest):
    """
    Proactively scan the writer's recent output against the Knowledge Graph.
    Returns up to 4 specific suggestions (potential contradictions, continuity
    opportunities, timeline gaps) to surface while the user is still writing.
    """
    db = get_database()

    # Build story bible summary to pass as grounding context to Groq
    story_bible_summary = ""
    if request.script_id:
        bible = await db["story_bibles"].find_one({"script_id": request.script_id})
        if bible:
            nodes = bible.get("nodes", [])
            links = bible.get("links", [])

            node_lines = [
                f"- {n.get('type', 'Entity')}: {n['id']}"
                for n in nodes[:40]
            ]
            link_lines = [
                f"- {l['source']} [{l.get('relation', 'related to')}] {l['target']}"
                for l in links[:60]
            ]

            if node_lines:
                story_bible_summary += "Entities:\n" + "\n".join(node_lines) + "\n"
            if link_lines:
                story_bible_summary += "Relationships:\n" + "\n".join(link_lines)

    try:
        result = await ai_auto_suggest(
            recent_text=request.recent_text,
            story_bible_summary=story_bible_summary,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_interaction(request: ChatRequest):
    """
    Endpoint for conversing with the Groq-powered AI writing assistant.
    """
    db = get_database()
    
    story_bible_summary = ""
    if request.scriptId:
        bible = await db["story_bibles"].find_one({"script_id": request.scriptId})
        if bible:
            nodes = bible.get("nodes", [])
            links = bible.get("links", [])
            
            # Format nodes (capped to avoid token limit errors)
            MAX_NODES = 50
            MAX_LINKS = 100
            
            node_summaries = []
            for n in nodes[:MAX_NODES]:
                mentions = n.get("mentions", [])
                mentions_preview = mentions[:5]
                if len(mentions) > 5:
                    mentions_preview.append("...")
                m_str = ", ".join(mentions_preview)
                node_summaries.append(f"- {n.get('type', 'Entity')}: {n['id']} (Scenes: {m_str})")
            if len(nodes) > MAX_NODES:
                node_summaries.append(f"... (and {len(nodes) - MAX_NODES} more entities)")
                
            # Format links (capped to avoid token limit errors)
            link_summaries = []
            for link in links[:MAX_LINKS]:
                rel = link.get("relation", "interacted with")
                link_summaries.append(f"- {link['source']} [{rel}] {link['target']}")
            if len(links) > MAX_LINKS:
                link_summaries.append(f"... (and {len(links) - MAX_LINKS} more relationships)")
                
            story_bible_summary = "STORY BIBLE CONTEXT:\n"
            if node_summaries:
                story_bible_summary += "Entities/Characters:\n" + "\n".join(node_summaries) + "\n\n"
            if link_summaries:
                story_bible_summary += "Relationships/Events:\n" + "\n".join(link_summaries) + "\n"
                
    # Fact Check mode — use RAG pipeline with knowledge graph retrieval
    if request.mode == "Fact Check":
        # Extract the last user message for fact checking
        last_user_msg = ""
        for msg in reversed(request.messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "")
                break

        # Also run the rule-based contradiction detector
        programmatic_flags = []
        if request.scriptId:
            bible = await db["story_bibles"].find_one({"script_id": request.scriptId})
            if bible:
                nodes = bible.get("nodes", [])
                links = bible.get("links", [])
                flags = detector.check_sentence(last_user_msg, existing_nodes=nodes, existing_links=links)
                
                # Save any contradictions found to DB for the UI panel
                for flag in flags:
                    new_contra = {
                        "script_id": request.scriptId,
                        "sentence": flag.get("conflicting_sentence"),
                        "conflict_with": flag.get("reason_detail"),
                        "reason_tag": flag.get("reason_tag"),
                        "resolved": False
                    }
                    await insert_document("contradictions", new_contra)
                    programmatic_flags.append(flag)

        reply = await fact_check_with_rag(
            user_message=last_user_msg,
            script_id=request.scriptId,
            editor_content=request.context,
            conversation_history=request.messages,
            programmatic_flags=programmatic_flags,
        )
        return {"reply": reply}

    # Standard / Advanced modes — use the regular chat reply
    reply = await generate_chat_reply(request.messages, request.context, story_bible_summary, request.mode)
    return {
        "reply": reply
    }