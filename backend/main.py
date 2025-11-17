"""
Xterra MVP Backend - FastAPI Application
Main entry point for the mineral discovery API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

# Import routes
try:
    from routes import analyze
except ImportError:
    analyze = None


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
            "analyze": "/analyze" if analyze else "Coming soon"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if analyze:
    app.include_router(analyze.router, prefix="/analyze", tags=["analysis"])


if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )