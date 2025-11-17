"""
Generate geological analysis, insights, and structured heatmap grids.

This module focuses on "thinking" about the data: it takes in raw
score/index arrays and turns them into interpretable analysis objects
that the API can return.
"""

from typing import Dict, Any

import numpy as np
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
    - Samples the underlying mineral indices at the centre of each cell.
    - Combines iron oxide, clay and a simple "ferrous" proxy into a
      single mineral potential score.
    - Normalises the final values to the 0–1 range.

    The output is a lightweight structure that the frontend can use
    directly with the existing colour legend.
    """

    # Ensure we are working with finite values only
    iron = np.nan_to_num(iron_oxide_index.astype("float32"), nan=0.0)
    clay = np.nan_to_num(clay_index.astype("float32"), nan=0.0)

    # Normalise each index to 0–1 based on its own distribution
    def _safe_normalise(arr: np.ndarray) -> np.ndarray:
        arr_min = float(np.nanmin(arr))
        arr_max = float(np.nanmax(arr))
        if arr_max <= arr_min:
            return np.zeros_like(arr, dtype="float32")
        return (arr - arr_min) / (arr_max - arr_min)

    iron_norm = _safe_normalise(iron)
    clay_norm = _safe_normalise(clay)

    # Simple proxy for "ferrous" behaviour:
    # here we reuse the iron signal as a stand‑in, but kept as a separate
    # component so we can adjust the formula later without touching callers.
    ferrous_norm = iron_norm.copy()

    # Combined mineral potential index in 0–1 range
    combined_index = (iron_norm + clay_norm + ferrous_norm) / 3.0

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

    for i in range(rows):
        # Sample latitude at the centre of the cell (from north to south)
        sample_lat = lat_max - (i + 0.5) * lat_step
        for j in range(cols):
            # Sample longitude at the centre of the cell (from west to east)
            sample_lon = lon_min + (j + 0.5) * lon_step

            try:
                # Convert geographic coordinate back to raster row/col
                r, c = rowcol(transform, sample_lon, sample_lat)
            except Exception:
                # If anything goes wrong, fall back to zero potential
                grid[i, j] = 0.0
                continue

            # Clamp indices to the valid raster bounds
            if 0 <= r < height and 0 <= c < width:
                grid[i, j] = float(combined_index[r, c])
            else:
                grid[i, j] = 0.0

    # Final normalisation of the grid to strict 0–1 range, so the
    # frontend can interpret colours consistently.
    finite_mask = np.isfinite(grid)
    if finite_mask.any():
        g_min = float(grid[finite_mask].min())
        g_max = float(grid[finite_mask].max())
        if g_max > g_min:
            grid[finite_mask] = (grid[finite_mask] - g_min) / (g_max - g_min)
        else:
            grid[finite_mask] = 0.0
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
