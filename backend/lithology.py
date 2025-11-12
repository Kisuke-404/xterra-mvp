"""
Classify rock types (lithology) from satellite imagery
"""

import numpy as np

def classify_lithology(red, nir, swir1, swir2):
    """
    Classify rock types from Sentinel-2 bands
    
    Returns:
    --------
    dict : Granite, Rhyolite, Basalt indices
    """
    
    # Normalize bands
    red = red.astype('float32')
    nir = nir.astype('float32')
    swir1 = swir1.astype('float32')
    swir2 = swir2.astype('float32')
    
    # Granite indicator
    granite_index = (swir2 / swir1) * (nir / red)
    granite_index = np.clip(granite_index / np.nanmax(granite_index), 0, 1)
    granite_index = np.nan_to_num(granite_index, 0)
    
    # Rhyolite indicator
    rhyolite_index = swir1 / red
    rhyolite_index = np.clip(rhyolite_index / np.nanmax(rhyolite_index), 0, 1)
    rhyolite_index = np.nan_to_num(rhyolite_index, 0)
    
    # Basalt indicator
    basalt_index = red / nir
    basalt_index = np.clip(basalt_index / np.nanmax(basalt_index), 0, 1)
    basalt_index = np.nan_to_num(basalt_index, 0)
    
    return {
        'granite': granite_index,
        'rhyolite': rhyolite_index,
        'basalt': basalt_index
    }
