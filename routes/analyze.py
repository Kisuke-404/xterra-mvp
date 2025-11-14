"""
Analysis Routes - Mineral Hotspot Detection API Endpoints
Handles satellite image analysis and mineral hotspot detection
"""

import sys
import os
import logging
from typing import List, Dict
import numpy as np
import rasterio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64
from io import BytesIO
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from PIL import Image

# Add project root to path to import backend modules
# This allows importing backend modules regardless of where the script is run from
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import backend analysis modules
from backend import mineral_indices, lithology, hotspot_detector, analysis
from config import CARLIN_IMAGE_PATH, CARLIN_TREND_COORDS

# Configure logging for this module
# This helps track errors and debug issues in production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI router for analysis endpoints
# Prefix and tags will be set when including in main app
router = APIRouter()


# ============================================================================
# REQUEST MODELS - Define the structure of incoming API requests
# ============================================================================

class AOIRequest(BaseModel):
    """
    Area of Interest (AOI) request model
    Defines the geographic bounds for mineral analysis
    """
    lat_min: float = CARLIN_TREND_COORDS["lat_min"]  # Minimum latitude (southern boundary)
    lat_max: float = CARLIN_TREND_COORDS["lat_max"]  # Maximum latitude (northern boundary)
    lon_min: float = CARLIN_TREND_COORDS["lon_min"]  # Minimum longitude (western boundary)
    lon_max: float = CARLIN_TREND_COORDS["lon_max"]  # Maximum longitude (eastern boundary)
    satellite_data_path: str = str(CARLIN_IMAGE_PATH)

# ============================================================================
# RESPONSE MODELS - Define the structure of API responses
# ============================================================================

class HotspotData(BaseModel):
    """
    Individual mineral hotspot data point
    Represents a single detected mineral deposit location
    """
    mineral: str      # Type of mineral (e.g., "copper", "gold")
    confidence: float # Confidence score (0-100%)
    lat: float        # Latitude coordinate of hotspot
    lon: float        # Longitude coordinate of hotspot
    depth_min: int    # Minimum expected depth in meters
    depth_max: int    # Maximum expected depth in meters


class AnalysisResponse(BaseModel):
    """
    Complete analysis response containing all results
    Includes hotspot locations, mineral potentials, and recommendations
    """
    status: str                    # Status of the analysis ("success" or "error")
    hotspots: List[HotspotData]    # List of detected mineral hotspots
    copper_potential: Dict         # Copper potential analysis results
    gold_potential: Dict           # Gold potential analysis results
    minerals: Dict                 # Mineral index analysis results
    recommendations: Dict          # Exploration recommendations and next steps
    copper_heatmap: str = ""       # Base64 encoded copper heatmap image
    gold_heatmap: str = ""         # Base64 encoded gold heatmap image
    heatmap_bounds: Dict = {}      # Geographic bounds of heatmap


# ============================================================================
# HELPER FUNCTIONS - Utility functions for data processing
# ============================================================================

def pixel_to_latlon(row: int, col: int, transform) -> tuple:
    """
    Convert pixel coordinates to geographic coordinates (latitude, longitude)
    
    Parameters:
    -----------
    row : int
        Pixel row index
    col : int
        Pixel column index
    transform : rasterio.Affine
        Geospatial transform from raster metadata
    
    Returns:
    --------
    tuple : (latitude, longitude) coordinates
    """
    lon, lat = rasterio.transform.xy(transform, row, col)
    return lat, lon


def extract_hotspots_from_mask(mask: np.ndarray, score_array: np.ndarray, 
                                transform, mineral_type: str, 
                                depth_range: tuple) -> List[HotspotData]:
    """
    Extract hotspot locations from a binary mask and convert to geographic coordinates
    
    Parameters:
    -----------
    mask : np.ndarray
        Binary mask where True indicates hotspot locations
    score_array : np.ndarray
        Confidence score array for calculating hotspot confidence
    transform : rasterio.Affine
        Geospatial transform for coordinate conversion
    mineral_type : str
        Type of mineral ("copper" or "gold")
    depth_range : tuple
        (min_depth, max_depth) in meters
    
    Returns:
    --------
    List[HotspotData] : List of detected hotspots with coordinates and confidence
    """
    hotspots = []
    
    # Find all True pixels in the mask (hotspot locations)
    hotspot_rows, hotspot_cols = np.where(mask)
    
    # Limit to top hotspots to avoid overwhelming response
    # Sort by confidence score and take top 50
    if len(hotspot_rows) > 0:
        scores = score_array[hotspot_rows, hotspot_cols]
        top_indices = np.argsort(scores)[-50:][::-1]  # Top 50, highest first
        
        for idx in top_indices:
            row = hotspot_rows[idx]
            col = hotspot_cols[idx]
            confidence = float(score_array[row, col])
            
            # Convert pixel coordinates to geographic coordinates
            lat, lon = pixel_to_latlon(row, col, transform)
            
            hotspot = HotspotData(
                mineral=mineral_type,
                confidence=round(confidence, 2),
                lat=round(lat, 6),
                lon=round(lon, 6),
                depth_min=depth_range[0],
                depth_max=depth_range[1]
            )
            hotspots.append(hotspot)
    
    return hotspots


def array_to_heatmap_image(score_array: np.ndarray, bounds: dict, mineral_type: str) -> str:
    """
    Convert a score array to a heatmap image and return as Base64
    
    Parameters:
    -----------
    score_array : np.ndarray
        Array of confidence scores (0-100)
    bounds : dict
        Geographic bounds {'lat_min', 'lat_max', 'lon_min', 'lon_max'}
    mineral_type : str
        "copper" or "gold" (for logging)
    
    Returns:
    --------
    str : Base64 encoded PNG image
    """
    try:
        # Create custom colormap: Red → Orange → Yellow → Light Yellow
        # Red (high confidence) → Yellow (low confidence)
        colors = ['#FFFFCC', '#FFD700', '#FFA500', '#FF4500']  # Light Yellow → Gold → Orange → Red
        n_bins = 100
        cmap = LinearSegmentedColormap.from_list('mineral', colors, N=n_bins)
        
        # Normalize array to 0-100 range
        normalized = np.clip(score_array, 0, 100)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 10), dpi=100)
        
        # Display heatmap
        im = ax.imshow(normalized, cmap=cmap, aspect='auto', origin='upper', vmin=0, vmax=100)
        
        # Remove axes
        ax.set_xticks([])
        ax.set_yticks([])
        ax.axis('off')
        
        # Convert to PNG in memory
        buffer = BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', pad_inches=0, transparent=True, dpi=100)
        buffer.seek(0)
        plt.close(fig)
        
        # Convert to Base64
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        logger.info(f"Generated {mineral_type} heatmap image (Base64 size: {len(image_base64)} bytes)")
        
        return image_base64
        
    except Exception as e:
        logger.error(f"Error generating heatmap image: {str(e)}")
        return ""


def crop_array_to_bounds(array: np.ndarray, full_bounds: dict, crop_bounds: dict, transform) -> np.ndarray:
    """
    Crop a raster array to specific geographic bounds
    
    Parameters:
    -----------
    array : np.ndarray
        Full raster array
    full_bounds : dict
        Full image bounds from rasterio
    crop_bounds : dict
        Desired crop bounds {'lat_min', 'lat_max', 'lon_min', 'lon_max'}
    transform : rasterio.Affine
        Geospatial transform
    
    Returns:
    --------
    np.ndarray : Cropped array
    """
    try:
        # Convert geographic bounds to pixel indices
        from rasterio.windows import Window
        
        # Get pixel coordinates for crop bounds
        row_min, col_min = rasterio.transform.rowcol(transform, crop_bounds['lon_max'], crop_bounds['lat_max'])
        row_max, col_max = rasterio.transform.rowcol(transform, crop_bounds['lon_min'], crop_bounds['lat_min'])
        
        # Ensure indices are within bounds
        row_min = max(0, row_min)
        col_min = max(0, col_min)
        row_max = min(array.shape[0], row_max)
        col_max = min(array.shape[1], col_max)
        
        # Crop array
        cropped = array[row_min:row_max, col_min:col_max]
        logger.info(f"Cropped array from {array.shape} to {cropped.shape}")
        
        return cropped
        
    except Exception as e:
        logger.error(f"Error cropping array: {str(e)}")
        return array


# ============================================================================
# API ENDPOINTS - Define the HTTP endpoints for the analysis API
# ============================================================================

@router.get("/status")
async def analyze_status():
    """
    Health check endpoint for the analysis service
    Returns status "ok" if the service is operational
    """
    return {"status": "ok"}


@router.post("/", response_model=AnalysisResponse)
async def analyze_aoi(request: AOIRequest):
    """
    Analyze Area of Interest (AOI) for mineral hotspots
    
    This endpoint performs a complete mineral analysis pipeline:
    1. Loads satellite imagery from the specified path
    2. Extracts relevant bands (Red, NIR, SWIR1, SWIR2)
    3. Calculates mineral indices (iron oxide, clay, silica, K-feldspar)
    4. Classifies lithology (rock types)
    5. Detects mineral hotspots (copper and gold)
    6. Generates geological analysis and recommendations
    
    Parameters:
    -----------
    request : AOIRequest
        Area of Interest with geographic bounds and satellite data path
    
    Returns:
    --------
    AnalysisResponse : Complete analysis results with hotspots and recommendations
    
    Raises:
    -------
    HTTPException : If file not found, invalid data, or processing errors occur
    """
    try:
        logger.info(f"Starting analysis for AOI: lat[{request.lat_min}, {request.lat_max}], "
                   f"lon[{request.lon_min}, {request.lon_max}]")
        
        # Step 1: Load satellite data using rasterio
        # Rasterio handles geospatial raster data formats (like GeoTIFF)
        if not os.path.exists(request.satellite_data_path):
            raise HTTPException(
                status_code=404,
                detail=f"Satellite data file not found: {request.satellite_data_path}"
            )
        
        logger.info(f"Loading satellite data from: {request.satellite_data_path}")
        with rasterio.open(request.satellite_data_path) as src:
            # Read the 4 bands required for mineral analysis
            # Band 1: Red (Band 4 in Sentinel-2)
            # Band 2: NIR (Band 8 in Sentinel-2)
            # Band 3: SWIR1 (Band 11 in Sentinel-2)
            # Band 4: SWIR2 (Band 12 in Sentinel-2)
            red = src.read(1).astype('float32')
            nir = src.read(2).astype('float32')
            swir1 = src.read(3).astype('float32')
            swir2 = src.read(4).astype('float32')
            
            # Store transform for coordinate conversion
            transform = src.transform
            logger.info(f"Loaded satellite data: shape={red.shape}")
        
        # Step 2: Calculate mineral indices
        # These indices identify specific mineral signatures in the satellite imagery
        logger.info("Calculating mineral indices...")
        mineral_indices_result = mineral_indices.calculate_mineral_indices(
            red, nir, swir1, swir2
        )
        
        # Step 3: Classify lithology (rock types)
        # Identifies the type of rock present, which helps determine mineral potential
        logger.info("Classifying lithology...")
        lithology_result = lithology.classify_lithology(red, nir, swir1, swir2)
        
        # Step 4: Calculate copper and gold potentials
        # Combines mineral indices and lithology to assess mineral deposit potential
        logger.info("Calculating mineral potentials...")
        copper_score = hotspot_detector.calculate_copper_potential(
            mineral_indices_result['kfeldspar'],
            mineral_indices_result['clay'],
            mineral_indices_result['iron_oxide'],
            lithology_result['granite']
        )
        
        gold_score = hotspot_detector.calculate_gold_potential(
            mineral_indices_result['silica'],
            mineral_indices_result['clay'],
            mineral_indices_result['kfeldspar'],
            mineral_indices_result['iron_oxide']
        )
        
        # Step 5: Detect hotspots
        # Identifies specific locations with high mineral potential
        logger.info("Detecting hotspots...")
        hotspots_result = hotspot_detector.detect_hotspots(
            copper_score, gold_score, threshold=65
        )
        
        # Step 6: Generate geological analysis
        # Creates professional analysis with interpretations and recommendations
        logger.info("Generating geological analysis...")
        geological_analysis = analysis.generate_geological_analysis(
            copper_score,
            gold_score,
            mineral_indices_result['kfeldspar'],
            mineral_indices_result['clay'],
            mineral_indices_result['iron_oxide'],
            mineral_indices_result['silica']
        )
        
        # Step 7: Generate heatmap images
        # Convert score arrays to Base64 encoded PNG images with legend colors
        logger.info("Generating heatmap images...")
        copper_heatmap = array_to_heatmap_image(hotspots_result['copper_score'], request.__dict__, "copper")
        gold_heatmap = array_to_heatmap_image(hotspots_result['gold_score'], request.__dict__, "gold")
        
        heatmap_bounds = {
            "lat_min": request.lat_min,
            "lat_max": request.lat_max,
            "lon_min": request.lon_min,
            "lon_max": request.lon_max,
        }
        
        # Step 8: Extract hotspot locations with coordinates
        # Convert pixel-based hotspots to geographic coordinates
        logger.info("Extracting hotspot coordinates...")
        all_hotspots = []
        
        # Extract copper hotspots (porphyry copper deposits, 250-750m depth)
        copper_hotspots = extract_hotspots_from_mask(
            hotspots_result['copper_mask'],
            hotspots_result['copper_score'],
            transform,
            "copper",
            (250, 750)  # Depth range for porphyry copper
        )
        all_hotspots.extend(copper_hotspots)
        
        # Extract gold hotspots (epithermal gold deposits, 100-300m depth)
        gold_hotspots = extract_hotspots_from_mask(
            hotspots_result['gold_mask'],
            hotspots_result['gold_score'],
            transform,
            "gold",
            (100, 300)  # Depth range for epithermal gold
        )
        all_hotspots.extend(gold_hotspots)
        
        logger.info(f"Found {len(all_hotspots)} total hotspots")
        
        # Step 9: Build response with all analysis results
        response = AnalysisResponse(
            status="success",
            hotspots=all_hotspots,
            copper_potential=geological_analysis['copper'],
            gold_potential=geological_analysis['gold'],
            minerals=geological_analysis['minerals'],
            recommendations=geological_analysis['recommendations'],
            copper_heatmap=copper_heatmap,
            gold_heatmap=gold_heatmap,
            heatmap_bounds=heatmap_bounds
        )
        
        logger.info("Analysis completed successfully")
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions (like 404 for file not found)
        raise
    except rasterio.errors.RasterioIOError as e:
        # Handle rasterio-specific errors (corrupted files, unsupported formats, etc.)
        logger.error(f"Rasterio error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error reading satellite data file: {str(e)}"
        )
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during analysis: {str(e)}"
        )