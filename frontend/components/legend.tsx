"use client"

interface LegendProps {
  isOpen: boolean
  onClose: () => void
}

export function Legend({ isOpen, onClose }: LegendProps) {
  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-16 w-80 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl p-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">Legend</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" title="Close">
          ✕
        </button>
      </div>

      {/* Heat Map Colors */}
      <div className="space-y-4">
        <div>
          <h3 className="text-white font-medium text-xs mb-2">Heat Map Intensity</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded border border-white/20" />
              <span className="text-white/70 text-xs">Very High Concentration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded border border-white/20" />
              <span className="text-white/70 text-xs">High Concentration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded border border-white/20" />
              <span className="text-white/70 text-xs">Medium Concentration</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-200 rounded border border-white/20" />
              <span className="text-white/70 text-xs">Low Concentration</span>
            </div>
          </div>
        </div>

        {/* Mineral Types */}
        <div className="border-t border-white/10 pt-4">
          <h3 className="text-white font-medium text-xs mb-2">Mineral Hotspots</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white" />
              <span className="text-white/70 text-xs">Copper (Cu) - Concentration Area</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />
              <span className="text-white/70 text-xs">Gold (Au) - Concentration Area</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="border-t border-white/10 pt-4 text-xs text-white/50">
          <p>Hotspot positions indicate areas of high mineral concentration within the selected AOI.</p>
        </div>
      </div>
    </div>
  )
}
