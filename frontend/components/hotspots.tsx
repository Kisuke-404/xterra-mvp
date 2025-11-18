"use client"

import { useEffect, useRef, useState } from "react"

interface Hotspot {
  mineral: string
  confidence: number
  lat: number
  lon: number
  depth_min: number
  depth_max: number
}

interface HotspotsProps {
  mapRef: any
  aoiGeometry: any
  isVisible: boolean
  hotspots: Hotspot[]
}

export function Hotspots({ mapRef, aoiGeometry, isVisible, hotspots }: HotspotsProps) {
  const hotspotsLayerRef = useRef<any>(null)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!isVisible || !mapRef.current || !hotspots || hotspots.length === 0) {
      if (hotspotsLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(hotspotsLayerRef.current)
        hotspotsLayerRef.current = null
      }
      return
    }

    const ol = (window as any).ol
    const map = mapRef.current

    const hotspotsSource = new ol.source.Vector()

    hotspots.forEach((hotspot, index) => {
      const coords = ol.proj.fromLonLat([hotspot.lon, hotspot.lat])
      const point = new ol.geom.Point(coords)
      const feature = new ol.Feature(point)
      
      feature.setProperties({
        hotspotData: hotspot,
        index: index,
      })
      
      hotspotsSource.addFeature(feature)
    })

    const styleFunction = (feature: any) => {
      const hotspot = feature.getProperties().hotspotData
      const type = hotspot.mineral.toLowerCase()

      let color, label
      if (type === "copper") {
        color = hotspot.confidence > 80 ? "#FF6B6B" : "#FFA07A"
        label = "Cu"
      } else {
        color = hotspot.confidence > 80 ? "#FFD700" : "#FFA500"
        label = "Au"
      }

      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          fill: new ol.style.Fill({ color }),
          stroke: new ol.style.Stroke({ color: "white", width: 2 }),
        }),
        text: new ol.style.Text({
          text: label,
          fill: new ol.style.Fill({ color: "white" }),
          font: "bold 11px Arial",
          offsetY: -16,
          backgroundFill: new ol.style.Fill({ color: "rgba(0,0,0,0.7)" }),
          padding: [2, 4, 2, 4],
        }),
      })
    }

    const hotspotsLayer = new ol.layer.Vector({
      source: hotspotsSource,
      style: styleFunction,
      zIndex: 100,
    })

    map.addLayer(hotspotsLayer)
    hotspotsLayerRef.current = hotspotsLayer

    console.log("[Hotspots] Rendered", hotspots.length, "hotspots on map")

    const clickHandler = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f: any) => {
        if (f.getProperties().hotspotData) {
          return f
        }
        return null
      })
      
      if (feature && feature.getProperties().hotspotData) {
        const hotspot = feature.getProperties().hotspotData
        setSelectedHotspot(hotspot)
        setCardPosition({ x: evt.pixel[0], y: evt.pixel[1] })
        console.log("[Hotspots] Clicked hotspot:", hotspot)
      } else {
        setSelectedHotspot(null)
        setCardPosition(null)
      }
    }

    map.on("click", clickHandler)

    return () => {
      if (hotspotsLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(hotspotsLayerRef.current)
        hotspotsLayerRef.current = null
      }
      map.un("click", clickHandler)
    }
  }, [isVisible, mapRef, hotspots])

  const getAOISize = () => {
    if (!aoiGeometry) return "N/A"
    const extent = aoiGeometry.getExtent()
    const ol = (window as any).ol
    const [lon1, lat1] = ol.proj.transform([extent[0], extent[1]], "EPSG:3857", "EPSG:4326")
    const [lon2, lat2] = ol.proj.transform([extent[2], extent[3]], "EPSG:3857", "EPSG:4326")
    
    const latDiff = Math.abs(lat2 - lat1)
    const lonDiff = Math.abs(lon2 - lon1)
    const sizeKm2 = (latDiff * 111) * (lonDiff * 111 * Math.cos((lat1 * Math.PI) / 180))
    return `${sizeKm2.toFixed(1)}km²`
  }

  if (!isVisible || !selectedHotspot || !cardPosition) return null

  return (
    <div
      className="absolute z-[200] pointer-events-none"
      style={{
        left: `${cardPosition.x + 20}px`,
        top: `${cardPosition.y - 100}px`,
      }}
    >
      <div className="bg-black/95 text-white rounded-lg shadow-2xl border-2 border-white/20 p-4 w-64 pointer-events-auto">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/20">
          <div className="text-2xl">⛏️</div>
          <h3 className="text-lg font-bold">Active Mineral</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/70">Likely Mineral:</span>
            <span className="font-bold text-white">
              {selectedHotspot.mineral === "copper" ? "Cu" : "Au"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">Confidence:</span>
            <span className="font-bold text-green-400">
              {selectedHotspot.confidence.toFixed(0)}%
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">Size:</span>
            <span className="font-bold text-white">{getAOISize()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-white/70">Depth Est:</span>
            <span className="font-bold text-white">
              {selectedHotspot.depth_min}-{selectedHotspot.depth_max}m
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            console.log("[Hotspot Card] Selected:", selectedHotspot)
          }}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Select Mineral
        </button>

        <div className="mt-2 text-xs text-white/50 text-center">
          Click elsewhere to close
        </div>
      </div>
    </div>
  )
}