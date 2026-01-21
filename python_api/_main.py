import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from python_api.routers import takeoffs_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Layerwise API...")

    # Verify required environment variables
    if not os.getenv("GOOGLE_API_KEY"):
        logger.warning("No AI API key found. Set GOOGLE_API_KEY")

    yield

    # Shutdown
    logger.info("Shutting down Layerwise API...")


app = FastAPI(
    title="Layerwise API",
    description="AI-powered blueprint takeoff API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration - strip whitespace from each origin
cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Mount at /python for Vercel (rewrite sends /python/* to this function)
# Also mount at root for local development (/takeoff/*)
app.include_router(takeoffs_router, prefix="/python")
app.include_router(takeoffs_router)  # Local dev fallback


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Layerwise API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "ai_configured": bool(os.getenv("GOOGLE_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    uvicorn.run(
        "python_api._main:app",
        host=host,
        port=port,
        reload=debug,
    )
