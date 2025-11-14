"use client"

import { useEffect, useRef } from "react"

interface HeatmapProps {
  isVisible: boolean
  heatmapImage: string // Base64 encoded image
  bounds: {
    lat_min: number
    lat_max: number
    lon_min: number
    lon_max: number
  }
  mineralType: "copper" | "gold"
  mapRef: any
}

export function Heatmap({ isVisible, heatmapImage, bounds, mineralType, mapRef }: HeatmapProps) {
  const heatmapLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!isVisible || !heatmapImage || !mapRef.current) return

    const ol = (window as any).ol
    const map = mapRef.current

    try {
      // Remove existing heatmap layer if any
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current)
      }

      // Create image source from Base64
      const imageSource = new ol.source.ImageStatic({
        url: `data:image/png;base64,${heatmapImage}`,
        projection: "EPSG:3857",
        imageExtent: ol.proj.transformExtent(
          [bounds.lon_min, bounds.lat_min, bounds.lon_max, bounds.lat_max],
          "EPSG:4326",
          "EPSG:3857"
        ),
      })

      // Create image layer
      const heatmapLayer = new ol.layer.Image({
        source: imageSource,
        opacity: 0.7, // Transparent so map shows below
        zIndex: 10,
      })

      // Add layer to map
      map.addLayer(heatmapLayer)
      heatmapLayerRef.current = heatmapLayer

      console.log(`[Heatmap] Displayed ${mineralType} heatmap overlay`)
    } catch (error) {
      console.error("[Heatmap] Error displaying heatmap:", error)
    }

    return () => {
      // Cleanup: remove layer when component unmounts
      if (heatmapLayerRef.current && map) {
        try {
          map.removeLayer(heatmapLayerRef.current)
        } catch (e) {
          console.error("[Heatmap] Error removing layer:", e)
        }
      }
    }
  }, [isVisible, heatmapImage, bounds, mapRef, mineralType])

  return null // No UI needed, just map layer
}