"""
Detect mineral hotspots
"""

import numpy as np
from scipy.ndimage import label

def calculate_copper_potential(kfeldspar_index, clay_index, 
                               iron_oxide_index, granite_index):
    """
    Calculate copper (porphyry) potential score
    
    Parameters:
    -----------
    kfeldspar_index : np.array
        K-feldspar index values
    clay_index : np.array
        Clay index values
    iron_oxide_index : np.array
        Iron oxide index values
    granite_index : np.array
        Granite classification values
    
    Returns:
    --------
    np.array : Copper potential scores (0-100%)
    """
    
    copper_score = (
        (kfeldspar_index / 3.0) * 0.4 +
        (clay_index / 2.0) * 0.3 +
        (iron_oxide_index + 1) / 2 * 0.15 +
        (granite_index) * 0.15
    )
    
    return np.clip(copper_score, 0, 1) * 100

def calculate_gold_potential(silica_index, clay_index, 
                            kfeldspar_index, iron_oxide_index):
    """
    Calculate gold (epithermal) potential score
    
    Parameters:
    -----------
    silica_index : np.array
        Silica index values
    clay_index : np.array
        Clay index values
    kfeldspar_index : np.array
        K-feldspar index values
    iron_oxide_index : np.array
        Iron oxide index values
    
    Returns:
    --------
    np.array : Gold potential scores (0-100%)
    """
    
    gold_score = (
        (silica_index / 1.183) * 0.4 +
        (clay_index / 2.0) * 0.3 +
        ((1 - kfeldspar_index/3.0)) * 0.15 +
        (iron_oxide_index + 1) / 2 * 0.15
    )
    
    return np.clip(gold_score, 0, 1) * 100

def detect_hotspots(copper_score, gold_score, threshold=65):
    """
    Detect hotspot clusters
    
    Parameters:
    -----------
    copper_score : np.array
        Copper potential scores
    gold_score : np.array
        Gold potential scores
    threshold : int
        Confidence threshold (0-100)
    
    Returns:
    --------
    dict : Detected hotspots with statistics
    """
    
    # Find high-confidence copper areas
    copper_mask = copper_score >= threshold
    labeled_copper, num_copper = label(copper_mask)
    
    # Find high-confidence gold areas
    gold_mask = gold_score >= threshold
    labeled_gold, num_gold = label(gold_mask)
    
    return {
        'copper_clusters': num_copper,
        'gold_clusters': num_gold,
        'copper_mask': copper_mask,
        'gold_mask': gold_mask,
        'copper_score': copper_score,
        'gold_score': gold_score
    }
