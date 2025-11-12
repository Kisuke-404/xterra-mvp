# Data Directory

## Satellite Imagery

### Carlin Trend, Nevada
- **File:** `carlin_s2.tif`
- **Source:** Sentinel-2
- **Resolution:** 10m per pixel
- **Bands:** Red, NIR, SWIR1, SWIR2
- **Size:** ~200MB
- **Coverage:** Carlin Trend mining district, Nevada US

**Note:** Not included in repo (too large). 
Store in: `/content/drive/MyDrive/xterra_data/carlin_s2.tif`

## Data Format
Sentinel-2 bands used:
- Band 4 (Red): 0.64-0.68 μm
- Band 8 (NIR): 0.77-0.79 μm
- Band 11 (SWIR1): 1.57-1.65 μm
- Band 12 (SWIR2): 2.10-2.28 μm

## Mineral Indices Calculated
1. **Iron Oxide Index** = (SWIR1 - NIR) / (SWIR1 + NIR)
2. **Clay Index** = SWIR1 / SWIR2
3. **Silica Index** = SWIR2 / SWIR1
4. **K-Feldspar Index** = NIR / Red
