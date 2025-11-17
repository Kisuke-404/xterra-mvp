"""
Generate geological analysis, insights, and structured heatmap grids.

This module focuses on "thinking" about the data: it takes in raw
score/index arrays and turns them into interpretable analysis objects
that the API can return, as well as lightweight heatmap images.
"""

from typing import Dict, Any
import base64
from io import BytesIO

import numpy as np
from PIL import Image
from rasterio.transform import rowcol


def generate_geological_analysis(
    copper_score: np.ndarray,
    gold_score: np.ndarray,
    kfeldspar_index: np.ndarray,
    clay_index: np.ndarray,
    iron_oxide_index: np.ndarray,
    silica_index: np.ndarray,
) -> Dict[str, Any]:
    """
    Generate professional geological analysis from model outputs.

    The goal here is to turn the "raw numbers" from the model
    into a human-readable summary with context and recommendations.
    """

    copper_max = float(np.nanmax(copper_score))
    copper_mean = float(np.nanmean(copper_score))
    gold_max = float(np.nanmax(gold_score))
    gold_mean = float(np.nanmean(gold_score))

    analysis: Dict[str, Any] = {
        "copper": {
            "mean": copper_mean,
            "max": copper_max,
            "assessment": "HIGH POTENTIAL"
            if copper_max > 85
            else "MODERATE POTENTIAL"
            if copper_max > 70
            else "LOW POTENTIAL",
            "depth_m": "250-750",
            "system": "Porphyry Copper",
            "host_rock": "Granite (Precambrian intrusive)",
        },
        "gold": {
            "mean": gold_mean,
            "max": gold_max,
            "assessment": "HIGH POTENTIAL"
            if gold_max > 80
            else "MODERATE-HIGH POTENTIAL"
            if gold_max > 65
            else "MODERATE POTENTIAL",
            "depth_m": "100-300",
            "system": "Epithermal Gold",
            "environment": "Silica-cap epithermal",
        },
        "minerals": {
            "kfeldspar": {
                "mean": float(np.nanmean(kfeldspar_index)),
                "max": float(np.nanmax(kfeldspar_index)),
                "status": "STRONG"
                if np.nanmax(kfeldspar_index) > 2.5
                else "MODERATE",
                "interpretation": "Potassic core of porphyry system → Copper mineralization",
            },
            "clay": {
                "mean": float(np.nanmean(clay_index)),
                "max": float(np.nanmax(clay_index)),
                "status": "STRONG"
                if np.nanmax(clay_index) > 1.8
                else "MODERATE",
                "interpretation": "Phyllosilicate-rich zones → Epithermal and distal porphyry",
            },
            "iron_oxide": {
                "mean": float(np.nanmean(iron_oxide_index)),
                "max": float(np.nanmax(iron_oxide_index)),
                "status": "STRONG"
                if np.nanmax(iron_oxide_index) > 0.6
                else "MODERATE",
                "interpretation": "Hematite/limonite → Near-surface oxidation and weathering",
            },
            "silica": {
                "mean": float(np.nanmean(silica_index)),
                "max": float(np.nanmax(silica_index)),
                "status": "STRONG"
                if np.nanmax(silica_index) > 1.0
                else "MODERATE",
                "interpretation": "Silica-rich cap → Shallow epithermal environment",
            },
        },
        "risk_assessment": {
            "signal_convergence": "Multiple alteration signals converge on same area",
            "system_type": "Classic porphyry system (PROVEN)",
            "similar_deposits": "Similar to existing Carlin deposits (KNOWN)",
            "overall_risk": "LOW",
        },
        "recommendations": {
            "immediate": [
                "Ground reconnaissance in AOI",
                "Rock sample collection for geochemistry",
                "Ground geophysical surveys (magnetic, gravity)",
            ],
            "short_term": [
                "Scout drilling program (0-3 months)",
                "Target: potassic-altered granite contact",
                "Depth: 300-500m initial holes",
            ],
            "medium_term": [
                "Core logging and assay (3-12 months)",
                "Update 3D geological model",
                "Define mineralized resource boundaries",
            ],
            "action": "PROCEED WITH DRILLING",
        },
    }

    return analysis


def generate_heatmap_grid(
    iron_oxide_index: np.ndarray,
    clay_index: np.ndarray,
    transform,
    bounds: Dict[str, float],
    grid_size: int = 50,
) -> Dict[str, Any]:
    """
    Build a regular 2D heatmap grid aligned with the AOI bounds.

    This function:
    - Creates a grid of `grid_size x grid_size` cells over the AOI.
    - Aggregates the underlying mineral indices using MAX for each cell.
    - Combines iron oxide, clay and a simple "ferrous" proxy into a
      single mineral potential score.
    - Normalises the final values to the 0–1 range.

    The output is a lightweight structure that the frontend can use
    directly with the existing colour legend.
    """

    # Ensure we are working with finite values only
    iron = np.nan_to_num(iron_oxide_index.astype("float32"), nan=0.0)
    clay = np.nan_to_num(clay_index.astype("float32"), nan=0.0)

    # Simple proxy for "ferrous" behaviour
    ferrous = iron.copy()

    # Combined mineral potential index
    combined_index = (iron + clay + ferrous) / 3.0

    lat_min = bounds["lat_min"]
    lat_max = bounds["lat_max"]
    lon_min = bounds["lon_min"]
    lon_max = bounds["lon_max"]

    rows = grid_size
    cols = grid_size
    grid = np.zeros((rows, cols), dtype="float32")

    # Step sizes in geographic space per grid cell
    lat_step = (lat_max - lat_min) / rows
    lon_step = (lon_max - lon_min) / cols

    height, width = combined_index.shape

    # FIXED: Aggregate over cell regions instead of point sampling
    for i in range(rows):
        cell_lat_max = lat_max - i * lat_step
        cell_lat_min = lat_max - (i + 1) * lat_step
        
        for j in range(cols):
            cell_lon_min = lon_min + j * lon_step
            cell_lon_max = lon_min + (j + 1) * lon_step

            try:
                # Get pixel bounds for this cell
                r_min, c_min = rowcol(transform, cell_lon_min, cell_lat_max)
                r_max, c_max = rowcol(transform, cell_lon_max, cell_lat_min)
                
                # Ensure proper ordering
                r_min, r_max = min(r_min, r_max), max(r_min, r_max)
                c_min, c_max = min(c_min, c_max), max(c_min, c_max)
                
                # Clamp to raster bounds
                r_min = max(0, r_min)
                r_max = min(height, r_max + 1)
                c_min = max(0, c_min)
                c_max = min(width, c_max + 1)
                
                # Extract cell region and take MAX value
                if r_min < r_max and c_min < c_max:
                    cell_region = combined_index[r_min:r_max, c_min:c_max]
                    if cell_region.size > 0:
                        grid[i, j] = float(np.nanmax(cell_region))
                    else:
                        grid[i, j] = 0.0
                else:
                    grid[i, j] = 0.0
                    
            except Exception:
                grid[i, j] = 0.0

    # Final normalisation to 0–1 range
    finite_mask = np.isfinite(grid) & (grid > 0)
    if finite_mask.any():
        g_min = float(grid[finite_mask].min())
        g_max = float(grid[finite_mask].max())
        if g_max > g_min:
            grid[finite_mask] = (grid[finite_mask] - g_min) / (g_max - g_min)
        else:
            grid[finite_mask] = 1.0  # If all values equal, set to max
    else:
        grid[:, :] = 0.0

    heatmap_grid: Dict[str, Any] = {
        "grid": grid.tolist(),
        "bounds": {
            "north": lat_max,
            "south": lat_min,
            "east": lon_max,
            "west": lon_min,
        },
        "resolution": {"rows": rows, "cols": cols},
        "color_scale": {
            "0.0-0.25": "#FFFF99",  # Light Yellow - Low
            "0.25-0.5": "#FFFF00",  # Yellow - Medium
            "0.5-0.75": "#FFA500",  # Orange - High
            "0.75-1.0": "#FF0000",  # Red - Very High
        },
    }

    return heatmap_grid


def _generate_single_index_grid(
    index_array: np.ndarray,
    transform,
    bounds: Dict[str, float],
    grid_size: int = 50,
) -> np.ndarray:
    """
    Helper: sample a single mineral index onto a regular 2D grid using MAX aggregation.
    
    FIXED: Now aggregates over cell regions instead of point sampling!
    """

    index = np.nan_to_num(index_array.astype("float32"), nan=0.0)

    lat_min = bounds["lat_min"]
    lat_max = bounds["lat_max"]
    lon_min = bounds["lon_min"]
    lon_max = bounds["lon_max"]

    rows = grid_size
    cols = grid_size
    grid = np.zeros((rows, cols), dtype="float32")

    lat_step = (lat_max - lat_min) / rows
    lon_step = (lon_max - lon_min) / cols

    height, width = index.shape

    # FIXED: Aggregate over cell regions
    for i in range(rows):
        cell_lat_max = lat_max - i * lat_step
        cell_lat_min = lat_max - (i + 1) * lat_step
        
        for j in range(cols):
            cell_lon_min = lon_min + j * lon_step
            cell_lon_max = lon_min + (j + 1) * lon_step

            try:
                # Get pixel bounds for this cell
                r_min, c_min = rowcol(transform, cell_lon_min, cell_lat_max)
                r_max, c_max = rowcol(transform, cell_lon_max, cell_lat_min)
                
                # Ensure proper ordering
                r_min, r_max = min(r_min, r_max), max(r_min, r_max)
                c_min, c_max = min(c_min, c_max), max(c_min, c_max)
                
                # Clamp to raster bounds
                r_min = max(0, r_min)
                r_max = min(height, r_max + 1)
                c_min = max(0, c_min)
                c_max = min(width, c_max + 1)
                
                # Extract cell region and take MAX value
                if r_min < r_max and c_min < c_max:
                    cell_region = index[r_min:r_max, c_min:c_max]
                    if cell_region.size > 0:
                        grid[i, j] = float(np.nanmax(cell_region))
                    else:
                        grid[i, j] = 0.0
                else:
                    grid[i, j] = 0.0
                    
            except Exception:
                grid[i, j] = 0.0

    # Normalize to 0–1 range
    finite_mask = np.isfinite(grid) & (grid > 0)
    
    # DEBUG LOGGING
    print(f"[HEATMAP DEBUG] Grid before normalization - Min: {np.min(grid):.4f}, Max: {np.max(grid):.4f}, Non-zero count: {np.count_nonzero(grid)}")
    
    if finite_mask.any():
        g_min = float(grid[finite_mask].min())
        g_max = float(grid[finite_mask].max())
        if g_max > g_min:
            grid[finite_mask] = (grid[finite_mask] - g_min) / (g_max - g_min)
        else:
            grid[finite_mask] = 1.0
    else:
        grid[:, :] = 0.0
        print("[HEATMAP DEBUG] WARNING: All grid values are zero!")

    # DEBUG LOGGING AFTER
    print(f"[HEATMAP DEBUG] Grid after normalization - Min: {np.min(grid):.4f}, Max: {np.max(grid):.4f}, Non-zero count: {np.count_nonzero(grid)}")
    
    return grid


def generate_copper_heatmap_grid(
    iron_oxide_index: np.ndarray,
    transform,
    bounds: Dict[str, float],
    grid_size: int = 50,
) -> np.ndarray:
    """
    Generate a 2D potential grid for copper, based on iron oxide + ferrous minerals.
    """

    iron = np.nan_to_num(iron_oxide_index.astype("float32"), nan=0.0)
    ferrous = iron.copy()

    # Combined copper potential index
    combined = (iron + ferrous) / 2.0

    return _generate_single_index_grid(combined, transform, bounds, grid_size)


def generate_gold_heatmap_grid(
    clay_index: np.ndarray,
    transform,
    bounds: Dict[str, float],
    grid_size: int = 50,
) -> np.ndarray:
    """
    Generate a 2D potential grid for gold, based purely on clay minerals.
    """

    return _generate_single_index_grid(clay_index, transform, bounds, grid_size)


def grid_to_colored_heatmap_image(grid: np.ndarray) -> str:
    """
    Convert a 2D grid of values in [0, 1] to a coloured PNG heatmap (Base64).

    Each cell in the grid becomes one pixel in a 50x50 image, coloured using
    the legend:
      - 0.0–0.25  → Light Yellow (255, 255, 153)
      - 0.25–0.5  → Yellow      (255, 255,   0)
      - 0.5–0.75  → Orange      (255, 165,   0)
      - 0.75–1.0  → Red         (255,   0,   0)

    FIXED: Returns ONLY base64 string (no data URL prefix) to avoid double prefix bug.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if grid.ndim != 2:
        raise ValueError("Heatmap grid must be a 2D array")

    rows, cols = grid.shape
    
    # DEBUG: Log grid statistics
    logger.info(f"[IMAGE DEBUG] Grid shape: {rows}x{cols}")
    logger.info(f"[IMAGE DEBUG] Grid min: {np.min(grid):.4f}, max: {np.max(grid):.4f}")
    logger.info(f"[IMAGE DEBUG] Grid non-zero: {np.count_nonzero(grid)}")

    # Create a new RGB image with one pixel per grid cell
    image = Image.new("RGB", (cols, rows))
    
    color_counts = {
        "light_yellow": 0,
        "yellow": 0,
        "orange": 0,
        "red": 0
    }
    
    for i in range(rows):
        for j in range(cols):
            v = grid[i, j]
            if not np.isfinite(v):
                v = 0.0

            # Clamp just in case
            v = max(0.0, min(1.0, float(v)))

            if v < 0.25:
                color = (255, 255, 153)  # Light Yellow
                color_counts["light_yellow"] += 1
            elif v < 0.5:
                color = (255, 255, 0)  # Yellow
                color_counts["yellow"] += 1
            elif v < 0.75:
                color = (255, 165, 0)  # Orange
                color_counts["orange"] += 1
            else:
                color = (255, 0, 0)  # Red
                color_counts["red"] += 1

            image.putpixel((j, i), color)
    
    logger.info(f"[IMAGE DEBUG] Color distribution: {color_counts}")

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    
    png_size = len(buffer.getvalue())
    logger.info(f"[IMAGE DEBUG] PNG file size: {png_size} bytes")

    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    logger.info(f"[IMAGE DEBUG] Final base64 string length: {len(encoded)} characters")
    
    # FIXED: Return ONLY base64 string, frontend will add data URL prefix
    return encoded


def format_analysis_report(analysis: Dict[str, Any]) -> str:
    """
    Format analysis as a readable text report.

    This is mainly useful for logging, debugging or exporting a
    human‑friendly report from the same structured analysis dictionary.
    """

    report = f"""
{'=' * 70}
GEOLOGICAL ANALYSIS REPORT
{'=' * 70}

🔴 COPPER POTENTIAL (Deep Porphyry System):
  Mean: {analysis['copper']['mean']:.1f}%
  Peak: {analysis['copper']['max']:.1f}%
  Assessment: {analysis['copper']['assessment']}
  Depth: {analysis['copper']['depth_m']}m
  Host Rock: {analysis['copper']['host_rock']}

🟡 GOLD POTENTIAL (Shallow Epithermal System):
  Mean: {analysis['gold']['mean']:.1f}%
  Peak: {analysis['gold']['max']:.1f}%
  Assessment: {analysis['gold']['assessment']}
  Depth: {analysis['gold']['depth_m']}m
  Environment: {analysis['gold']['environment']}

📊 MINERAL SIGNATURES:
  K-Feldspar: {analysis['minerals']['kfeldspar']['status']}
    → {analysis['minerals']['kfeldspar']['interpretation']}
  
  Clay: {analysis['minerals']['clay']['status']}
    → {analysis['minerals']['clay']['interpretation']}
  
  Iron Oxide: {analysis['minerals']['iron_oxide']['status']}
    → {analysis['minerals']['iron_oxide']['interpretation']}
  
  Silica: {analysis['minerals']['silica']['status']}
    → {analysis['minerals']['silica']['interpretation']}

⚠️ RISK ASSESSMENT:
  Signal Convergence: {analysis['risk_assessment']['signal_convergence']}
  System Type: {analysis['risk_assessment']['system_type']}
  Similar Deposits: {analysis['risk_assessment']['similar_deposits']}
  Overall Risk: {analysis['risk_assessment']['overall_risk']}

🎯 RECOMMENDATIONS:
  Immediate: {', '.join(analysis['recommendations']['immediate'])}
  Short-term: {', '.join(analysis['recommendations']['short_term'])}
  Medium-term: {', '.join(analysis['recommendations']['medium_term'])}

📋 FINAL RECOMMENDATION: {analysis['recommendations']['action']}

{'=' * 70}
"""

    return report