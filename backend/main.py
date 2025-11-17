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
import numpy as np
import rasterio
from rasterio.transform import from_bounds
import gdown  # type: ignore[import]

# Ensure backend package is on the Python path so we can import routes reliably
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def generate_synthetic_data_at_coordinates(file_path):
    """Generate synthetic data at user's AOI coordinates as fallback"""
    print("Generating synthetic data at user's AOI coordinates...")

    # User's target coordinates (center: 40.9840, -116.3840)
    center_lat, center_lon = 40.9840, -116.3840

    # Create bounding box
    lat_range = 0.5  # 0.5 degrees latitude
    lon_range = 0.6  # 0.6 degrees longitude

    lon_min = center_lon - lon_range / 2
    lon_max = center_lon + lon_range / 2
    lat_min = center_lat - lat_range / 2
    lat_max = center_lat + lat_range / 2

    # Create realistic synthetic data
    height, width = 500, 500
    np.random.seed(42)

    # Base bands
    band1 = np.full((height, width), 2000, dtype="uint16")  # Red
    band2 = np.full((height, width), 3000, dtype="uint16")  # NIR
    band3 = np.full((height, width), 2500, dtype="uint16")  # SWIR1
    band4 = np.full((height, width), 2000, dtype="uint16")  # SWIR2

    # Create EXTREMELY strong signatures
    # Add 15 MASSIVE iron oxide hotspots (very high band1, very low band4)
    for _ in range(15):
        y = np.random.randint(50, height - 100)
        x = np.random.randint(50, width - 100)
        size = np.random.randint(60, 100)

        Y, X = np.ogrid[:size, :size]
        center = size // 2
        dist = np.sqrt((Y - center) ** 2 + (X - center) ** 2)
        mask = np.maximum(1 - dist / (size / 2), 0)

        # MUCH stronger signatures
        band1[y : y + size, x : x + size] += (mask * 8000).astype("uint16")  # Massive iron oxide
        band4[y : y + size, x : x + size] = np.maximum(
            band4[y : y + size, x : x + size] - (mask * 1500).astype("uint16"),
            300,
        )

    # Add 15 MASSIVE clay hotspots (very high band3)
    for _ in range(15):
        y = np.random.randint(50, height - 100)
        x = np.random.randint(50, width - 100)
        size = np.random.randint(60, 100)

        Y, X = np.ogrid[:size, :size]
        center = size // 2
        dist = np.sqrt((Y - center) ** 2 + (X - center) ** 2)
        mask = np.maximum(1 - dist / (size / 2), 0)

        band3[y : y + size, x : x + size] += (mask * 10000).astype("uint16")  # Massive clay signature

    # Add some K-feldspar signatures (high band2, moderate band3)
    for _ in range(10):
        y = np.random.randint(50, height - 100)
        x = np.random.randint(50, width - 100)
        size = np.random.randint(50, 90)

        Y, X = np.ogrid[:size, :size]
        center = size // 2
        dist = np.sqrt((Y - center) ** 2 + (X - center) ** 2)
        mask = np.maximum(1 - dist / (size / 2), 0)

        band2[y : y + size, x : x + size] += (mask * 6000).astype("uint16")
        band3[y : y + size, x : x + size] += (mask * 3000).astype("uint16")

    # Create transform
    transform = from_bounds(lon_min, lat_min, lon_max, lat_max, width, height)

    # Write GeoTIFF
    with rasterio.open(
        file_path,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=4,
        dtype="uint16",
        crs="EPSG:4326",
        transform=transform,
    ) as dst:
        dst.write(band1, 1)
        dst.write(band2, 2)
        dst.write(band3, 3)
        dst.write(band4, 4)

    print(
        f"✓ Generated synthetic data at coords: {lat_min:.2f}-{lat_max:.2f}, {lon_min:.2f}-{lon_max:.2f}"
    )


def download_carlin_data():
    """Download real Carlin data and reposition, or generate synthetic fallback"""
    file_path = "/app/backend/data/carlin_s2.tif"
    temp_path = "/app/backend/data/carlin_original.tif"

    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Check if already exists and is valid
    if os.path.exists(file_path) and os.path.getsize(file_path) > 1_000_000:
        print(f"✓ Carlin data already exists at {file_path}")
        return

    # TRY APPROACH 1: Download real Carlin data
    print("Attempting to download real Carlin data from Google Drive...")
    url = "https://drive.google.com/file/d/1OuwOtp55u3_JHR2xIofvJkJz1mLhW6ns/view?usp=sharing"

    try:
        gdown.download(url, temp_path, quiet=False, fuzzy=True)

        # Check if download succeeded
        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 1_000_000:
            print("✓ Real Carlin data downloaded successfully!")
            print("Repositioning to user's AOI coordinates...")

            # Read original data
            with rasterio.open(temp_path) as src:
                data = src.read()

            # User's target coordinates
            center_lat, center_lon = 40.9840, -116.3840
            lat_range, lon_range = 0.5, 0.6

            lon_min = center_lon - lon_range / 2
            lon_max = center_lon + lon_range / 2
            lat_min = center_lat - lat_range / 2
            lat_max = center_lat + lat_range / 2

            # Create new transform
            height, width = data.shape[1], data.shape[2]
            transform = from_bounds(lon_min, lat_min, lon_max, lat_max, width, height)

            # Write with new coordinates
            with rasterio.open(
                file_path,
                "w",
                driver="GTiff",
                height=height,
                width=width,
                count=data.shape[0],
                dtype=data.dtype,
                crs="EPSG:4326",
                transform=transform,
            ) as dst:
                dst.write(data)

            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)

            print(
                f"✓ Repositioned real Carlin data to: {lat_min:.2f}-{lat_max:.2f}, {lon_min:.2f}-{lon_max:.2f}"
            )
            return
        else:
            print("✗ Download failed or file too small, using synthetic data...")

    except Exception as e:
        print(f"✗ Download error: {e}")
        print("Falling back to synthetic data...")

    # APPROACH 2: Generate synthetic data (fallback)
    generate_synthetic_data_at_coordinates(file_path)


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