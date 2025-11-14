"""
Xterra MVP Backend
Core processing logic for mineral discovery
"""

__version__ = "0.1.0"
__author__ = "Kisuke-404"

from .mineral_indices import calculate_mineral_indices
from .lithology import classify_lithology
from .hotspot_detector import detect_hotspots
from .analysis import generate_geological_analysis

__all__ = [
    'calculate_mineral_indices',
    'classify_lithology',
    'detect_hotspots',
    'generate_geological_analysis'
]
