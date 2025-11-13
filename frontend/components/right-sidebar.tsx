"use client"

interface RightSidebarProps {
  activeStage: string
  onStageChange: (stage: string) => void
  isDrawingMode: boolean
  searchActive: boolean
  dataSelectOpen?: boolean
  insightsOpen?: boolean
  hotspotsVisible?: boolean
}

export function RightSidebar({
  activeStage,
  onStageChange,
  isDrawingMode,
  searchActive,
  dataSelectOpen,
  insightsOpen,
  hotspotsVisible,
}: RightSidebarProps) {
  const stages = [
    { id: "search", icon: "🔍", title: "AOI Search" },
    { id: "data", icon: "📊", title: "Select Data" },
    { id: "insights", icon: "💡", title: "Insights" },
    { id: "legend", icon: "📋", title: "Legend", visible: hotspotsVisible },
  ]

  return (
    <div className="fixed right-4 top-20 flex flex-col gap-2 z-50">
      {stages.map((stage) => {
        // Hide legend button until hotspots are visible
        if (stage.id === "legend" && !hotspotsVisible) return null

        let isActive = false
        if (stage.id === "search" && searchActive) isActive = true
        if (stage.id === "data" && (activeStage === "data" || dataSelectOpen)) isActive = true
        if (stage.id === "insights" && (activeStage === "insights" || insightsOpen)) isActive = true
        if (stage.id === "legend" && activeStage === "legend") isActive = true

        return (
          <div key={stage.id} className="group relative">
            <button
              onClick={() => onStageChange(stage.id)}
              className={`flex items-center justify-center w-8 h-8 rounded-md border-l-4 transition-all ${
                isActive
                  ? "border-l-blue-500 bg-black/80 text-blue-400"
                  : "border-l-transparent bg-black/60 text-white/70 hover:bg-black/80 hover:text-white"
              }`}
              title={stage.title}
            >
              <span className="text-base">{stage.icon}</span>
            </button>

            <div className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/80 text-white/90 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {stage.title}
            </div>
          </div>
        )
      })}
    </div>
  )
}