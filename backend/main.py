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
    """Generate synthetic test GeoTIFF if real file doesn't exist"""

    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds

    file_path = "/app/backend/data/carlin_s2.tif"

    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Check if file already exists
    if os.path.exists(file_path):
        print(f"✓ Carlin data file already exists at {file_path}")
        return

    print("Generating synthetic test data for Carlin Trend...")

    try:
        # Carlin Trend coordinates
        lon_min, lon_max = -116.8, -116.2
        lat_min, lat_max = 40.5, 40.95

        # Create synthetic 4-band image (500x500 pixels)
        height, width = 500, 500

        # Generate realistic bands with mineral signatures
        np.random.seed(42)  # For reproducibility
        band1 = np.random.randint(1000, 3000, (height, width), dtype='uint16')  # Red
        band2 = np.random.randint(2000, 4000, (height, width), dtype='uint16')  # NIR
        band3 = np.random.randint(1500, 3500, (height, width), dtype='uint16')  # SWIR1
        band4 = np.random.randint(1000, 3000, (height, width), dtype='uint16')  # SWIR2

        # Add multiple strong hotspot areas (iron oxide signature)
        for _ in range(5):
            y = np.random.randint(50, height - 50)
            x = np.random.randint(50, width - 50)
            size = 30
            band1[y : y + size, x : x + size] += np.random.randint(800, 1500)  # Iron oxide
            band4[y : y + size, x : x + size] += np.random.randint(500, 1000)  # Ferrous

        # Add clay mineral hotspots
        for _ in range(5):
            y = np.random.randint(50, height - 50)
            x = np.random.randint(50, width - 50)
            size = 25
            band3[y : y + size, x : x + size] += np.random.randint(1000, 2000)  # Clay signature

        # Create transform
        transform = from_bounds(lon_min, lat_min, lon_max, lat_max, width, height)

        # Write GeoTIFF
        with rasterio.open(
            file_path, 'w',
            driver='GTiff',
            height=height, width=width,
            count=4,
            dtype='uint16',
            crs='EPSG:4326',
            transform=transform
        ) as dst:
            dst.write(band1, 1)
            dst.write(band2, 2)
            dst.write(band3, 3)
            dst.write(band4, 4)

        print(f"✓ Generated synthetic test data at {file_path}")
    except Exception as e:
        print(f"✗ Error generating test data: {e}")


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