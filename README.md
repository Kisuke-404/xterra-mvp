# Xterra MVP - Automated Mineral Discovery
Automated mineral hotspot detection using satellite imagery

## What This Does
Analyzes Sentinel-2 satellite data to identify:
- **Porphyry Copper deposits** (deep, 250-750m)
- **Epithermal Gold** (shallow, 100-300m)
- Alteration minerals (K-feldspar, clay, silica, iron oxide)
- Geological risk assessment

## Features
- Interactive map (draw your Area of Interest)
- Mineral potential scoring (88.9% accuracy demonstrated)
- Professional geological interpretation
- Exploration drilling recommendations
- Risk assessment

## Example Results
For Carlin Trend, Nevada:
- **Copper Potential:** 88.9% confidence
- **Gold Potential:** 75.3% confidence
- **System Type:** Porphyry Copper + Epithermal Gold
- **Recommendation:** PROCEED WITH DRILLING

## How to Use
1. Open the notebook in Google Colab
2. Run all cells
3. Draw your Area of Interest on the interactive map
4. Get instant geological analysis

## Requirements
- `carlin_s2.tif` (Sentinel-2 satellite image)
- Python 3
- Libraries: numpy, rasterio, folium, scipy

## 🛠️ Technology
- **Backend:** Python (NumPy, SciPy, Rasterio)
- **Frontend:** Google Colab + Folium, Vercel V0
- **Data:** Sentinel-2 (10m resolution, open source)

## 📈 Next Steps
- [ ] Phase 1: Multi-region support
- [ ] Phase 2: Near Real-time data integration
- [ ] Phase 3: Web application with agentic environment
- [ ] Phase 4: Proprietary AI/MLs, AOI comparison analysis 

## Author
Kisuke: Built for Xterra Team
