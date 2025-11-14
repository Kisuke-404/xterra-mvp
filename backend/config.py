"""
Xterra MVP Configuration
Central configuration file for paths, API settings, and application constants
"""

from pathlib import Path
import os

# Project root directory - the directory where this config file is located
# This ensures paths work correctly regardless of where the script is run from
PROJECT_ROOT = Path(__file__).parent.resolve()

# Data directory path - where satellite imagery and other data files are stored
DATA_DIR = PROJECT_ROOT / "data"

# Path to the Carlin Trend Sentinel-2 satellite image
# This is the default test image for mineral analysis
CARLIN_IMAGE_PATH = DATA_DIR / "carlin_s2.tif"

# API Server Configuration
# These settings control how the FastAPI application runs
API_HOST = "0.0.0.0"  # Listen on all network interfaces (allows external access)
API_PORT = 8000       # Port number for the API server
API_RELOAD = True     # Enable auto-reload on code changes (useful for development)

# CORS (Cross-Origin Resource Sharing) Configuration
# Allows frontend applications from different origins to access the API
# Using ["*"] allows all origins - suitable for development
# In production, specify exact origins for security
CORS_ORIGINS = ["*"]

# Logging Configuration
# Controls the verbosity of application logs
# Options: "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"
LOG_LEVEL = "INFO"
# Carlin Trend Coordinates (Nevada, USA)
# Default Area of Interest for mineral analysis
CARLIN_TREND_COORDS = {
    "latitude": 40.9845,
    "longitude": -116.3848,
    "lat_min": 40.97,
    "lat_max": 40.99,
    "lon_min": -116.39,
    "lon_max": -116.38,
}

# Print configuration paths when module is imported
# This helps verify that paths are set correctly during development
print(f"[Config] Project Root: {PROJECT_ROOT}")
print(f"[Config] Data Directory: {DATA_DIR}")
print(f"[Config] Carlin Image Path: {CARLIN_IMAGE_PATH}")

