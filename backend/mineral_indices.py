"""
Calculate mineral indices from satellite imagery
"""

import numpy as np

def calculate_mineral_indices(red, nir, swir1, swir2):
    """
    Calculate 4 mineral indices from Sentinel-2 bands
    
    Parameters:
    -----------
    red : np.array
        Red band (Band 4)
    nir : np.array
        Near-infrared band (Band 8)
    swir1 : np.array
        Short-wave infrared 1 (Band 11)
    swir2 : np.array
        Short-wave infrared 2 (Band 12)
    
    Returns:
    --------
    dict : Dictionary with 4 mineral indices
    """
    
    # Convert to float
    red = red.astype('float32')
    nir = nir.astype('float32')
    swir1 = swir1.astype('float32')
    swir2 = swir2.astype('float32')
    
    # Replace invalid values
    red = np.where(red <= 0, 0.0001, red)
    nir = np.where(nir <= 0, 0.0001, nir)
    swir1 = np.where(swir1 <= 0, 0.0001, swir1)
    swir2 = np.where(swir2 <= 0, 0.0001, swir2)
    
    # Iron Oxide Index
    iron_oxide_index = (swir1 - nir) / (swir1 + nir + 1e-8)
    iron_oxide_index = np.clip(iron_oxide_index, -1, 1)
    iron_oxide_index = np.nan_to_num(iron_oxide_index, 0)
    
    # Clay Index
    clay_index = swir1 / swir2
    clay_index = np.clip(clay_index, 0, 2)
    clay_index = np.nan_to_num(clay_index, 0)
    
    # Silica Index
    silica_index = swir2 / swir1
    silica_index = np.clip(silica_index, 0, 2)
    silica_index = np.nan_to_num(silica_index, 0)
    
    # K-Feldspar Index
    kfeldspar_index = nir / red
    kfeldspar_index = np.clip(kfeldspar_index, 0, 3)
    kfeldspar_index = np.nan_to_num(kfeldspar_index, 0)
    
    return {
        'iron_oxide': iron_oxide_index,
        'clay': clay_index,
        'silica': silica_index,
        'kfeldspar': kfeldspar_index
    }
