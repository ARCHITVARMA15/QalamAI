from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db_helpers import find_many, update_document, insert_document
from config.db import get_database

# Import our AI Engines
from services.knowledge_graph import KnowledgeGraphEngine
from services.contradiction_detector import ContradictionDetector
from services.persona_generator import PersonaGenerator
from services.style_transformer import StyleTransformer
from services.enhancement_service import EnhancementService
from ai.groq_service import generate_chat_reply

router = APIRouter()

# Initialize models once at startup (module level) to avoid reloading spaCy per request
try:
    kg_engine = KnowledgeGraphEngine()
    detector = ContradictionDetector()
    persona_gen = PersonaGenerator()
    style_transformer = StyleTransformer()
    enhancement_service = EnhancementService()
except Exception as e:
    print(f"Error loading NLP engines: {e}")

class AnalyzeRequest(BaseModel):
    text: str

class PersonaRequest(BaseModel):
    content: str
    
class AIActionRequest(BaseModel):
    content: str
    tone: str = "formal"

class ChatRequest(BaseModel):
    messages: list
    projectId: str
    scriptId: str = ""
    context: str = ""

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

@router.post("/transform-style")
async def transform_style(request: AIActionRequest):
    """
    Endpoint for style and tone transformation using T5 and rules.
    """
    result = style_transformer.transform_style(request.content, request.tone)
    
    return {
        "result": result["modified"],
        "changes": [
            {
                "type": tag["type"],
                "description": tag["detail"]
            } for tag in result["reason_tags"]
        ]
    }

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
            
            # Format nodes
            node_summaries = []
            for n in nodes:
                # E.g., Character: Arjun (mentions: scene_1)
                mentions = ", ".join(n.get("mentions", []))
                node_summaries.append(f"- {n.get('type', 'Entity')}: {n['id']} (Scenes: {mentions})")
                
            # Format links
            link_summaries = []
            for link in links:
                rel = link.get("relation", "interacted with")
                link_summaries.append(f"- {link['source']} [{rel}] {link['target']}")
                
            story_bible_summary = "STORY BIBLE CONTEXT:\n"
            if node_summaries:
                story_bible_summary += "Entities/Characters:\n" + "\n".join(node_summaries) + "\n\n"
            if link_summaries:
                story_bible_summary += "Relationships/Events:\n" + "\n".join(link_summaries) + "\n"
                
    reply = await generate_chat_reply(request.messages, request.context, story_bible_summary)
    return {
        "reply": reply
    }