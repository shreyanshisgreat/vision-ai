import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.chat_routes import router as chat_router
from app.routes.image_routes import router as image_router
from app.services.image_analyzer import get_analyzer_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Preloads the image analyzer model on startup so that user requests have zero cold-start delay.
    """
    print("[Startup] Initializing computer vision model...")
    try:
        analyzer = get_analyzer_service()
        print(f"[Startup] Model loaded successfully from {analyzer.model_path}.")
    except Exception as exc:
        print(f"[Startup] Warning: Model failed to preload: {exc}")
    yield
    print("[Shutdown] Application shutting down.")


app = FastAPI(
    title="Conversational Image Recognition Chatbot API",
    description="Phase 2: Conversational Image Understanding & Question Answering",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS for local development and frontend client
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Allow overriding origins via environment variable
custom_origins = os.getenv("ALLOWED_ORIGINS")
if custom_origins:
    allowed_origins.extend([origin.strip() for origin in custom_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(image_router)
app.include_router(chat_router)


@app.get("/", summary="Root health & info")
async def root():
    return {
        "project": "Conversational Image Recognition Chatbot",
        "phase": 2,
        "status": "online",
        "docs_url": "/docs",
        "analyze_endpoint": "/api/analyze-image",
        "chat_endpoint": "/api/chat",
    }
