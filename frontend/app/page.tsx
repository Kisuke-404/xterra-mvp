"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { AOIsView } from "@/components/aois-view"
import { ProjectsView } from "@/components/projects-view"
import { PlaceholderView } from "@/components/placeholder-view"
import { RightSidebar } from "@/components/right-sidebar"
import { AOISearch } from "@/components/aoi-search"
import { SelectData } from "@/components/select-data"
import { Insights } from "@/components/insights"
import { Hotspots } from "@/components/hotspots"
import { Legend } from "@/components/legend"
import { handleUploadAOI } from "@/utils/uploadAOI"
import { Heatmap } from "@/components/heatmap"

const CARLIN_TREND_COORDS = {
  latitude: 40.9845,
  longitude: -116.3848,
}

// ============================================================================
// NEW: Haversine formula to calculate distance in km between two coordinates
// ============================================================================
function getDistanceInKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const mapRef = useRef<any>(null)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const drawInteractionRef = useRef<any>(null)
  const vectorSourceRef = useRef<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState("home")

  const [searchOpen, setSearchOpen] = useState(false)
  const [activeStage, setActiveStage] = useState("")
  const [dataSelectOpen, setDataSelectOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [hotspotsVisible, setHotspotsVisible] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [drawnAOI, setDrawnAOI] = useState<any>(null)
  const [copperHeatmap, setCopperHeatmap] = useState<string>("")
  const [goldHeatmap, setGoldHeatmap] = useState<string>("")
  const [heatmapBounds, setHeatmapBounds] = useState<any>(null)

  // ============================================================================
  // NEW: State for dimension display
  // ============================================================================
  const [aoiDimensions, setAoiDimensions] = useState<{ size: number; isValid: boolean } | null>(null)
  const dimensionOverlayRef = useRef<any>(null)

  useEffect(() => {
    // Load OpenLayers from CDN
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/ol@v9.2.4/dist/ol.min.js"
    script.async = true
    script.onload = () => {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://cdn.jsdelivr.net/npm/ol@v9.2.4/ol.min.css"
      document.head.appendChild(link)

      initializeMap()
    }
    document.head.appendChild(script)
  }, [])

  const initializeMap = () => {
    const ol = (window as any).ol

    const satelliteLayer = new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      }),
    })

    vectorSourceRef.current = new ol.source.Vector()
    const vectorLayer = new ol.layer.Vector({
      source: vectorSourceRef.current,
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: "#FFFFFF", // White by default
          width: 2,
        }),
        fill: new ol.style.Fill({
          color: "rgba(255, 255, 255, 0.1)",
        }),
      }),
    })

    const map = new ol.Map({
      target: mapContainer.current,
      layers: [satelliteLayer, vectorLayer],
      view: new ol.View({
        center: ol.proj.fromLonLat([CARLIN_TREND_COORDS.longitude, CARLIN_TREND_COORDS.latitude]),
        zoom: 14,
      }),
    })

    mapRef.current = map

    map.getControls().clear()
    map.addControl(
      new ol.control.Zoom({
        className: "ol-zoom ol-unselectable ol-control",
        target: undefined,
      }),
    )

    map.on("pointermove", (evt: any) => {
      const coords = map.getEventCoordinate(evt.originalEvent)
      const [lon, lat] = ol.proj.transform(coords, "EPSG:3857", "EPSG:4326")
      setCoordinates({
        lat: Number.parseFloat(lat.toFixed(4)),
        lon: Number.parseFloat(lon.toFixed(4)),
      })
    })
  }

  // ============================================================================
  // NEW: Updated handleDrawAOI with square constraints and dimension display
  // ============================================================================
  const handleDrawAOI = () => {
    const ol = (window as any).ol
    const map = mapRef.current

    if (isDrawingMode) {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current)
        drawInteractionRef.current = null
      }
      if (dimensionOverlayRef.current) {
        map.removeOverlay(dimensionOverlayRef.current)
        dimensionOverlayRef.current = null
      }
      setIsDrawingMode(false)
      setAoiDimensions(null)
    } else {
      // Clear existing features
      vectorSourceRef.current.clear()

      // Create dimension overlay element
      const overlayElement = document.createElement("div")
      overlayElement.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        white-space: nowrap;
        border: 2px solid white;
      `

      const dimensionOverlay = new ol.Overlay({
        element: overlayElement,
        positioning: "top-left",
        stopEvent: false,
        offset: [10, -10],
      })
      map.addOverlay(dimensionOverlay)
      dimensionOverlayRef.current = dimensionOverlay

      // Custom geometry function that forces SQUARE shape with 5-50km limits
      const createSquareWithLimits = function (coordinates: any, geometry: any) {
        const ol = (window as any).ol
        const start = coordinates[0]
        const end = coordinates[1]

        // Convert to lat/lon for distance calculation
        const [startLon, startLat] = ol.proj.transform(start, "EPSG:3857", "EPSG:4326")
        const [endLon, endLat] = ol.proj.transform(end, "EPSG:3857", "EPSG:4326")

        // Calculate width and height in km
        const widthKm = getDistanceInKm(startLon, startLat, endLon, startLat)
        const heightKm = getDistanceInKm(startLon, startLat, startLon, endLat)

        // Use the larger dimension to create a square
        let sizeKm = Math.max(widthKm, heightKm)

        // HARD LIMIT: Clamp to 5-50km
        const MIN_KM = 5
        const MAX_KM = 50
        sizeKm = Math.max(MIN_KM, Math.min(MAX_KM, sizeKm))

        // Check if valid (5-50km)
        const isValid = sizeKm >= MIN_KM && sizeKm <= MAX_KM

        // Calculate new end point to make it square
        const kmPerDegreeLat = 111.32 // Approximate
        const kmPerDegreeLon = kmPerDegreeLat * Math.cos((startLat * Math.PI) / 180)

        const deltaLat = (sizeKm / kmPerDegreeLat) * (endLat > startLat ? 1 : -1)
        const deltaLon = (sizeKm / kmPerDegreeLon) * (endLon > startLon ? 1 : -1)

        const newEndLon = startLon + deltaLon
        const newEndLat = startLat + deltaLat

        const newEnd = ol.proj.fromLonLat([newEndLon, newEndLat])

        // Create square coordinates
        const squareCoords = [
          start,
          [newEnd[0], start[1]],
          newEnd,
          [start[0], newEnd[1]],
          start,
        ]

        // Update dimension display
        setAoiDimensions({ size: sizeKm, isValid })

        // Update overlay position and content
        overlayElement.textContent = `${sizeKm.toFixed(1)}km × ${sizeKm.toFixed(1)}km`
        overlayElement.style.color = isValid ? "white" : "red"
        overlayElement.style.borderColor = isValid ? "white" : "red"
        dimensionOverlay.setPosition(newEnd)

        // Create or update geometry
        if (!geometry) {
          geometry = new ol.geom.Polygon([squareCoords])
        } else {
          geometry.setCoordinates([squareCoords])
        }

        return geometry
      }

      const draw = new ol.interaction.Draw({
        source: vectorSourceRef.current,
        type: "Circle",
        geometryFunction: createSquareWithLimits,
        style: function (feature: any) {
          const dims = aoiDimensions
          const isValid = dims ? dims.isValid : true
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: isValid ? "#FFFFFF" : "#FF0000",
              width: 2,
            }),
            fill: new ol.style.Fill({
              color: isValid ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 0, 0, 0.1)",
            }),
          })
        },
      })

      map.addInteraction(draw)
      drawInteractionRef.current = draw
      setIsDrawingMode(true)

      draw.on("drawend", (evt: any) => {
        const geometry = evt.feature.getGeometry()
        const dims = aoiDimensions

        // Only proceed if valid size
        if (dims && dims.isValid) {
          console.log("[v0] AOI drawn:", geometry, `Size: ${dims.size.toFixed(1)}km`)
          setDrawnAOI(geometry)
          setDataSelectOpen(true)
          setActiveStage("data")

          // Update feature style to white
          evt.feature.setStyle(
            new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: "#FFFFFF",
                width: 2,
              }),
              fill: new ol.style.Fill({
                color: "rgba(255, 255, 255, 0.1)",
              }),
            })
          )
        } else {
          // Remove invalid AOI
          vectorSourceRef.current.removeFeature(evt.feature)
          alert("AOI must be between 5km × 5km and 50km × 50km")
        }

        setIsDrawingMode(false)
        map.removeInteraction(draw)
        drawInteractionRef.current = null

        // Remove overlay
        if (dimensionOverlayRef.current) {
          map.removeOverlay(dimensionOverlayRef.current)
          dimensionOverlayRef.current = null
        }
        setAoiDimensions(null)
      })
    }
  }

  const handleStageChange = (stage: string) => {
    if (stage === "search") {
      setSearchOpen(!searchOpen)
      setDataSelectOpen(false)
      setInsightsOpen(false)
      setLegendOpen(false)
    } else if (stage === "draw") {
      handleDrawAOI()
    } else if (stage === "data") {
      setDataSelectOpen(!dataSelectOpen)
      setSearchOpen(false)
      setInsightsOpen(false)
      setLegendOpen(false)
    } else if (stage === "insights") {
      setInsightsOpen(!insightsOpen)
      setSearchOpen(false)
      setDataSelectOpen(false)
      setLegendOpen(false)
    } else if (stage === "legend") {
      setLegendOpen(!legendOpen)
      setSearchOpen(false)
      setDataSelectOpen(false)
      setInsightsOpen(false)
    }
  }

  const handleSearch = (lat: number, lon: number, place: string) => {
    console.log("[v0] Searched location:", place, lat, lon)
    const ol = (window as any).ol
    const map = mapRef.current
    if (map) {
      map.getView().animate({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: 16,
        duration: 500,
      })
      
      vectorSourceRef.current.clear()
      
      const markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
      })
      
      markerFeature.setStyle(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({ color: "#FF6B6B" }),
            stroke: new ol.style.Stroke({ color: "#FFFFFF", width: 2 }),
          }),
        }),
      )
      
      vectorSourceRef.current.addFeature(markerFeature)
    }
  }

  const handleRunModel = async (filters: any) => {
    console.log("[v0] Running model with filters:", filters)
    setDataSelectOpen(false)
    setInsightsOpen(true)
    setActiveStage("insights")
    setHotspotsVisible(false)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/analyze/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat_min: drawnAOI ? 40.97 : 40.97,
          lat_max: drawnAOI ? 40.99 : 40.99,
          lon_min: drawnAOI ? -116.39 : -116.39,
          lon_max: drawnAOI ? -116.38 : -116.38,
        }),
      })
      
      if (!response.ok) throw new Error("Analysis failed")
      
      const data = await response.json()
      
      if (data.copper_heatmap) setCopperHeatmap(data.copper_heatmap)
      if (data.gold_heatmap) setGoldHeatmap(data.gold_heatmap)
      if (data.heatmap_bounds) setHeatmapBounds(data.heatmap_bounds)
      
      console.log("[v0] Analysis complete, heatmap data received")
    } catch (error) {
      console.error("[v0] Error calling backend:", error)
    }
    
    setTimeout(() => {
      setHotspotsVisible(true)
    }, 5000)
  }

  const handleInsightsLoadComplete = () => {
    setHotspotsVisible(true)
  }

  const renderContent = () => {
    if (activeView === "home") {
      return (
        <>
          <div ref={mapContainer} className="w-full h-full" />

          <Heatmap
            isVisible={hotspotsVisible && copperHeatmap !== ""}
            heatmapImage={copperHeatmap}
            bounds={heatmapBounds || { lat_min: 40.97, lat_max: 40.99, lon_min: -116.39, lon_max: -116.38 }}
            mineralType="copper"
            mapRef={mapRef}
          />
          <Heatmap
            isVisible={hotspotsVisible && goldHeatmap !== ""}
            heatmapImage={goldHeatmap}
            bounds={heatmapBounds || { lat_min: 40.97, lat_max: 40.99, lon_min: -116.39, lon_max: -116.38 }}
            mineralType="gold"
            mapRef={mapRef}
          />

          <div className="absolute bottom-16 right-4 flex flex-col gap-2">
            <div
              id="zoom-controls"
              className="flex flex-col gap-1 bg-black/70 rounded-md overflow-hidden border border-white/20"
            >
              <button
                onClick={() => mapRef.current?.getView().setZoom(mapRef.current?.getView().getZoom() + 1)}
                className="w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/80 text-white font-bold border-b border-white/20 transition-colors"
              >
                +
              </button>
              <button
                onClick={() => mapRef.current?.getView().setZoom(mapRef.current?.getView().getZoom() - 1)}
                className="w-8 h-8 flex items-center justify-center bg-black/70 hover:bg-black/80 text-white font-bold transition-colors"
              >
                −
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-md text-sm font-mono border border-white/20">
            {coordinates ? (
              <span>
                {coordinates.lat.toFixed(4)}, {coordinates.lon.toFixed(4)}
              </span>
            ) : (
              <span>
                {CARLIN_TREND_COORDS.latitude}, {CARLIN_TREND_COORDS.longitude}
              </span>
            )}
          </div>
        </>
      )
    }

    if (activeView === "aois") return <AOIsView />
    if (activeView === "projects") return <ProjectsView />
    if (activeView === "workflows") return <PlaceholderView title="Workflows" icon="⚙️" />
    if (activeView === "marketplace") return <PlaceholderView title="Marketplace" icon="🛒" />
    if (activeView === "teams") return <PlaceholderView title="Teams" icon="👥" />
    if (activeView === "geoai") return <PlaceholderView title="GeoAI" icon="🤖" />
    if (activeView === "timelines") return <PlaceholderView title="Timelines" icon="📊" />
  }

  return (
    <main className="w-full h-screen relative bg-black">
      <Header
        onDrawAOI={handleDrawAOI}
        onUploadAOI={handleUploadAOI}
        isDrawingMode={isDrawingMode}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <RightSidebar
        activeStage={activeStage}
        onStageChange={handleStageChange}
        isDrawingMode={isDrawingMode}
        searchActive={searchOpen}
        dataSelectOpen={dataSelectOpen}
        insightsOpen={insightsOpen}
        hotspotsVisible={hotspotsVisible}
      />
      <AOISearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSearch={handleSearch} mapRef={mapRef} />
      <SelectData isOpen={dataSelectOpen} onClose={() => setDataSelectOpen(false)} onRunModel={handleRunModel} />
      <Insights
        isOpen={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        onLoadingComplete={handleInsightsLoadComplete}
      />
      <Legend isOpen={legendOpen} onClose={() => setLegendOpen(false)} />
      <Hotspots mapRef={mapRef} aoiGeometry={drawnAOI} isVisible={hotspotsVisible} />
      {renderContent()}
    </main>
  )
}