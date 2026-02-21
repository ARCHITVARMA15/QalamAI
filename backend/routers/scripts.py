from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from config.db_helpers import insert_document, find_by_id, find_many, update_document
from datetime import datetime

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
    return {"status": "success", "script_id": script_id}

@router.get("/scripts/{script_id}")
async def get_script(script_id: str):
    script = await find_by_id("scripts", script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script

@router.put("/scripts/{script_id}")
async def autosave_script(script_id: str, content: str):
    updated = await update_document("scripts", script_id, {
        "content": content,
        "word_count": len(content.split())
    })
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to save script")
    return {"status": "success", "message": "Saved"}