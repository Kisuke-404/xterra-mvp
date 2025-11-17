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
import gdown  # type: ignore[import]

# Ensure backend package is on the Python path so we can import routes reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def download_carlin_data() -> None:
    """Download carlin_s2.tif from Google Drive if not present."""

    file_path = "/app/backend/data/carlin_s2.tif"

    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Check if file already exists and is valid (size > 1MB)
    if os.path.exists(file_path) and os.path.getsize(file_path) > 1_000_000:
        print(f"✓ Carlin data file already exists at {file_path}")
        return

    print("Downloading carlin_s2.tif from Google Drive (this may take 2-3 minutes)...")

    # Use full Google Drive URL with gdown fuzzy mode
    url = "https://drive.google.com/file/d/1OuwOtp55u3_JHR2xIofvJkJz1mLhW6ns/view?usp=sharing"

    try:
        # Use fuzzy=True to handle large files and permission issues
        gdown.download(url, file_path, quiet=False, fuzzy=True)

        # Verify file was downloaded and is valid
        if os.path.exists(file_path) and os.path.getsize(file_path) > 1_000_000:
            print(f"✓ Downloaded carlin_s2.tif successfully ({os.path.getsize(file_path)} bytes)")
        else:
            print("✗ Download failed or file is too small")
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        # Log but do not crash the app – analysis endpoints can then
        # report a more specific error when they try to use the file.
        print(f"✗ Error downloading file: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)


# Import analysis router with graceful fallback if it is not available
# Import routes
try:
    from backend.routes.analyze import router as analyze_router
    ANALYZE_AVAILABLE = True
except ImportError:
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
    Lifespan context manager for startup and shutdown events.

    On startup we ensure the Carlin satellite data is present by
    downloading it from Google Drive if needed.
    """

    download_carlin_data()
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