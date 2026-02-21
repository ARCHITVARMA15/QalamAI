from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.db_helpers import find_many, update_document, insert_document
from config.db import get_database

# Import our AI Engines
from services.knowledge_graph import KnowledgeGraphEngine
from services.contradiction_detector import ContradictionDetector

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str

@router.post("/scripts/{script_id}/analyze")
async def analyze_script(script_id: str, request: AnalyzeRequest):
    # Option B: Initialize models inside the route
    try:
        kg_engine = KnowledgeGraphEngine()
        detector = ContradictionDetector(kg_engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load AI models: {str(e)}")

    # 1. Contradiction Detection
    # Run the new text against the existing graph to find logic errors
    flags = detector.check_sentence(request.text, scene_id="current_scene")

    # 2. Knowledge Graph Update
    # Process the text to extract entities and relationships
    kg_engine.process_text(request.text, scene_id="current_scene")
    
    # Export the graph data into a JSON structure
    graph_data = kg_engine.get_graph_data()

    db = get_database()
    
    # 3. Save the Story Bible to MongoDB (Upsert logic to create or update)
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
        return {"characters": {}, "locations": [], "timeline_events": []}
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