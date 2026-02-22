from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from config.db_helpers import insert_document, find_by_id, find_many, update_document, delete_document
from datetime import datetime
from data.file_parser import DocumentParser

router = APIRouter()

class ProjectCreate(BaseModel):
    owner_id: str
    title: str
    description: str

class ScriptCreate(BaseModel):
    title: str
    content: str = ""

@router.post("/projects")
async def create_project(project: ProjectCreate):
    new_proj = {
        "owner_id": project.owner_id,
        "title": project.title,
        "description": project.description,
        "language": "en",
        "collaborators": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    proj_id = await insert_document("projects", new_proj)
    return {"status": "success", "project_id": proj_id}

@router.get("/projects")
async def get_projects(owner_id: str):
    projects = await find_many("projects", {"owner_id": owner_id})
    return projects

@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await find_by_id("projects", project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    deleted = await delete_document("projects", project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "success"}

class ProjectUpdate(BaseModel):
    title: str

@router.put("/projects/{project_id}")
async def rename_project(project_id: str, update: ProjectUpdate):
    updated = await update_document("projects", project_id, {
        "title": update.title,
        "updated_at": datetime.utcnow()
    })
    return {"status": "success"}

@router.get("/projects/{project_id}/scripts")
async def get_project_scripts(project_id: str):
    scripts = await find_many("scripts", {"project_id": project_id})
    # Sort scripts by created_at descending to get the most recent one first
    scripts.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
    return scripts

@router.post("/projects/{project_id}/scripts")
async def create_script(project_id: str, script: ScriptCreate):
    new_script = {
        "project_id": project_id,
        "title": script.title,
        "content": script.content,
        "version": 1,
        "word_count": len(script.content.split()),
        "language": "en",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    script_id = await insert_document("scripts", new_script)
    # Note: `script_id` is returned, ignoring unused variable `updated` logic for lint.
    return {"status": "success", "script_id": script_id}

@router.post("/projects/{project_id}/scripts/upload")
async def upload_script(project_id: str, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    extracted_stories = await DocumentParser.process_file(file)
    saved_script_ids = []
    
    # Process each detected story
    for idx, story_text in enumerate(extracted_stories):
        # Generate title: if single story, use filename. If multiple, append part number
        title = file.filename
        if len(extracted_stories) > 1:
            title = f"{file.filename} - Part {idx + 1}"
            
        new_script = {
            "project_id": project_id,
            "title": title,
            "content": story_text,
            "version": 1,
            "word_count": len(story_text.split()),
            "language": "en",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        script_id = await insert_document("scripts", new_script)
        saved_script_ids.append(script_id)
        
    return {
        "status": "success", 
        "script_ids": saved_script_ids,
        "title": file.filename,
        "stories_detected": len(extracted_stories)
    }

@router.get("/scripts/{script_id}")
async def get_script(script_id: str):
    script = await find_by_id("scripts", script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script

class AutosaveRequest(BaseModel):
    content: str

@router.put("/scripts/{script_id}")
async def autosave_script(script_id: str, request: AutosaveRequest):
    updated = await update_document("scripts", script_id, {
        "content": request.content,
        "word_count": len(request.content.split())
    })
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to save script")
    return {"status": "success", "message": "Saved"}