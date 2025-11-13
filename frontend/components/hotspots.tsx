"use client"

import { useEffect, useRef } from "react"

interface HotspotsProps {
  mapRef: any
  aoiGeometry: any
  isVisible: boolean
}

export function Hotspots({ mapRef, aoiGeometry, isVisible }: HotspotsProps) {
  const heatmapLayerRef = useRef<any>(null)
  const hotspotsLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!isVisible || !mapRef.current || !aoiGeometry) return

    const ol = (window as any).ol

    // Get AOI bounds for hotspot placement
    const extent = aoiGeometry.getExtent()
    const [minX, minY, maxX, maxY] = extent

    // Calculate hotspot positions
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const topY = maxY - (maxY - minY) * 0.1
    const bottomY = minY + (maxY - minY) * 0.1
    const rightX = maxX - (maxX - minX) * 0.1

    // Create hotspots vector layer
    const hotspotsSource = new ol.source.Vector()

    // Cu hotspots (2 - top and bottom)
    const cuTop = new ol.geom.Point([centerX, topY])
    const cuTopFeature = new ol.Feature(cuTop)
    cuTopFeature.setProperties({ type: "cu", intensity: "high" })
    hotspotsSource.addFeature(cuTopFeature)

    const cuBottom = new ol.geom.Point([centerX, bottomY])
    const cuBottomFeature = new ol.Feature(cuBottom)
    cuBottomFeature.setProperties({ type: "cu", intensity: "medium" })
    hotspotsSource.addFeature(cuBottomFeature)

    // Au hotspot (1 - right side)
    const auRight = new ol.geom.Point([rightX, centerY])
    const auRightFeature = new ol.Feature(auRight)
    auRightFeature.setProperties({ type: "au", intensity: "high" })
    hotspotsSource.addFeature(auRightFeature)

    // Style function for hotspots
    const styleFunction = (feature: any) => {
      const type = feature.getProperties().type
      const intensity = feature.getProperties().intensity

      let color, label
      if (type === "cu") {
        color = intensity === "high" ? "#FF6B6B" : "#FFA07A"
        label = "Cu"
      } else {
        color = intensity === "high" ? "#FFD700" : "#FFA500"
        label = "Au"
      }

      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({ color }),
          stroke: new ol.style.Stroke({ color: "white", width: 2 }),
        }),
        text: new ol.style.Text({
          text: label,
          fill: new ol.style.Fill({ color: "white" }),
          font: "bold 10px Arial",
          offsetY: -12,
        }),
      })
    }

    const hotspotsLayer = new ol.layer.Vector({
      source: hotspotsSource,
      style: styleFunction,
      zIndex: 100,
    })

    mapRef.current.addLayer(hotspotsLayer)
    hotspotsLayerRef.current = hotspotsLayer

    return () => {
      if (hotspotsLayerRef.current) {
        mapRef.current?.removeLayer(hotspotsLayerRef.current)
      }
    }
  }, [isVisible, mapRef, aoiGeometry])

  return null
}
