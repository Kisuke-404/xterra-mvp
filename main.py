"""
Xterra MVP Backend - FastAPI Application
Main entry point for the mineral discovery API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

# Import routes (will be created next)
try:
    from routes import analyze
except ImportError:
    # Routes module not yet created - will be available after routes.analyze is created
    analyze = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    Can be used for database connections, background tasks, etc.
    """
    # Startup logic can go here
    yield
    # Shutdown logic can go here


# Initialize FastAPI application with title and description
app = FastAPI(
    title="Xterra MVP Backend",
    description="AI-powered mineral hotspot detection using satellite imagery",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS middleware to allow all origins
# This allows the frontend to make requests from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
async def root():
    """
    Root endpoint that returns API information
    """
    return {
        "name": "Xterra MVP Backend",
        "version": "1.0.0",
        "description": "AI-powered mineral hotspot detection using satellite imagery",
        "endpoints": {
            "health": "/health",
            "analyze": "/analyze" if analyze else "Coming soon"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running
    Returns status "ok" if the service is healthy
    """
    return {"status": "ok"}


# Include routes from routes.analyze if available
if analyze:
    app.include_router(analyze.router, prefix="/analyze", tags=["analysis"])


if __name__ == "__main__":
    """
    Run the FastAPI application using uvicorn
    Configuration:
    - host: 0.0.0.0 (allows access from any network interface)
    - port: 8000 (default FastAPI port)
    - reload: True (enables auto-reload on code changes for development)
    """
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

