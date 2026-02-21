from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config.db import connect_db, close_db

# Lifespan handles startup and shutdown events — modern FastAPI pattern
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs when app starts — opens DB connection
    await connect_db()
    yield
    # Runs when app stops — closes DB connection cleanly
    await close_db()

from routers import users, scripts, analysis, media

app = FastAPI(
    title="Kalam API",
    description="AI-Powered Script & Content Enhancement System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Allow frontend React app to communicate with our backend
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",  # React default
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint to verify backend is running."""
    return {"status": "ok", "message": "Kalam AI Backend is running"}

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(scripts.router, prefix="/api", tags=["Projects & Scripts"])
app.include_router(analysis.router, prefix="/api", tags=["AI Engine"])
app.include_router(media.router, prefix="/api", tags=["Media Generation"])

# WebSocket for real-time collaboration
@app.websocket("/ws/collab/{doc_id}")
async def websocket_collab(websocket: WebSocket, doc_id: str):
    """
    WebSocket endpoint for real-time collaborative editing using Yjs CRDT logic.
    """
    await websocket.accept()
    # Placeholder: Keeping sockets empty for now
    pass

if __name__ == "__main__":
    import uvicorn
    # Make sure to run the server for dev using: uvicorn main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
