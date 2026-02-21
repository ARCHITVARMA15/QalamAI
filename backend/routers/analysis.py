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
    # Process the ENTIRE text to extract entities and relationships (Stateless)
    graph_data = kg_engine.process_text(request.text, scene_id="current_scene")

    # 4. Save the Story Bible to MongoDB (Upsert logic to create or update)
    # We store the nodes (characters/locations) and links (relationships)
    bible_data = {
        "script_id": script_id,
        "nodes": graph_data.get("nodes", []),
        "links": graph_data.get("links", [])
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