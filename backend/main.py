"""
Xterra MVP Backend - FastAPI Application
Main entry point for the mineral discovery API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
import sys
import os

# Ensure backend package is on the Python path so we can import routes reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import analysis router with graceful fallback if it is not available
try:
    from routes.analyze import router as analyze_router
    ANALYZE_AVAILABLE = True
except ImportError as e:
    print(f"Failed to import analyze router: {e}")
    ANALYZE_AVAILABLE = False
    analyze_router = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    yield


app = FastAPI(
    title="Xterra MVP Backend",
    description="AI-powered mineral hotspot detection using satellite imagery",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Xterra MVP Backend",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze" if ANALYZE_AVAILABLE else "Coming soon",
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if ANALYZE_AVAILABLE:
    app.include_router(analyze_router, prefix="/analyze", tags=["analysis"])


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )