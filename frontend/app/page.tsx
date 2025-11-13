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
import { Insights } from "@/components/insights" // Added Insights import
import { Hotspots } from "@/components/hotspots" // Added hotspots import
import { Legend } from "@/components/legend" // Added legend import
import { handleUploadAOI } from "@/utils/uploadAOI"

const CARLIN_TREND_COORDS = {
  latitude: 40.7822,
  longitude: -116.214,
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
  const [insightsOpen, setInsightsOpen] = useState(false) // Added insights state
  const [hotspotsVisible, setHotspotsVisible] = useState(false) // Added hotspots state
  const [legendOpen, setLegendOpen] = useState(false) // Added legend state
  const [drawnAOI, setDrawnAOI] = useState<any>(null) // Added state to store drawn AOI geometry

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

      // Initialize map after OL is loaded
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
          color: "#00BFFF",
          width: 2,
        }),
        fill: new ol.style.Fill({
          color: "rgba(0, 191, 255, 0.1)",
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

  const handleDrawAOI = () => {
    const ol = (window as any).ol
    const map = mapRef.current

    if (isDrawingMode) {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current)
        drawInteractionRef.current = null
      }
      setIsDrawingMode(false)
    } else {
      const draw = new ol.interaction.Draw({
        source: vectorSourceRef.current,
        type: "Circle",
        geometryFunction: ol.interaction.Draw.createBox(),
      })

      map.addInteraction(draw)
      drawInteractionRef.current = draw
      setIsDrawingMode(true)

      draw.on("drawend", (evt: any) => {
        console.log("[v0] AOI drawn:", evt.feature)
        setDrawnAOI(evt.feature.getGeometry()) // Store the drawn geometry
        setIsDrawingMode(false)
        map.removeInteraction(draw)
        drawInteractionRef.current = null
        setDataSelectOpen(true)
        setActiveStage("data")
      })
    }
  }

  const handleStageChange = (stage: string) => {
    if (stage === "search") {
      setSearchOpen(!searchOpen)
      setDataSelectOpen(false)
      setInsightsOpen(false)
      setLegendOpen(false) // Close legend when changing stages
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
      // Added legend stage
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
      // Pan and zoom to location
      map.getView().animate({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: 16,
        duration: 500,
      })
      
      // Clear existing markers
      vectorSourceRef.current.clear()
      
      // Add marker at searched location
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

  const handleRunModel = (filters: any) => {
    console.log("[v0] Running model with filters:", filters)
    setDataSelectOpen(false)
    setInsightsOpen(true)
    setActiveStage("insights")
    // Reset hotspots for new model run
    setHotspotsVisible(false)
  }

  // Trigger hotspots display when insights load completes
  const handleInsightsLoadComplete = () => {
    setHotspotsVisible(true)
  }

  const renderContent = () => {
    if (activeView === "home") {
      return (
        <>
          <div ref={mapContainer} className="w-full h-full" />

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

    if (activeView === "aois") {
      return <AOIsView />
    }

    if (activeView === "projects") {
      return <ProjectsView />
    }

    if (activeView === "workflows") {
      return <PlaceholderView title="Workflows" icon="⚙️" />
    }

    if (activeView === "marketplace") {
      return <PlaceholderView title="Marketplace" icon="🛒" />
    }

    if (activeView === "teams") {
      return <PlaceholderView title="Teams" icon="👥" />
    }

    if (activeView === "geoai") {
      return <PlaceholderView title="GeoAI" icon="🤖" />
    }

    if (activeView === "timelines") {
      return <PlaceholderView title="Timelines" icon="📊" />
    }
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
        hotspotsVisible={hotspotsVisible} // Pass hotspots visibility to sidebar
      />
      <AOISearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSearch={handleSearch} mapRef={mapRef} />
      <SelectData isOpen={dataSelectOpen} onClose={() => setDataSelectOpen(false)} onRunModel={handleRunModel} />
      <Insights
        isOpen={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        onLoadingComplete={handleInsightsLoadComplete} // Pass completion callback
      />
      <Legend isOpen={legendOpen} onClose={() => setLegendOpen(false)} /> {/* Added legend component */}
      <Hotspots mapRef={mapRef} aoiGeometry={drawnAOI} isVisible={hotspotsVisible} /> {/* Added hotspots component */}
      {renderContent()}
    </main>
  )
}
