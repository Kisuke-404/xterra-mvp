"use client"

import { useEffect, useState } from "react"

interface InsightsProps {
  isOpen: boolean
  onClose: () => void
  onLoadingComplete?: () => void // add callback when insights load completes
}

export function Insights({ isOpen, onClose, onLoadingComplete }: InsightsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate 5 second loading
      const timer = setTimeout(() => {
        setIsLoading(false)
        setResults({
          anomalies: 3,
          coverage: "92%",
          quality: "High",
          vegetation: "Stable",
          trend: "No significant changes",
        })
        onLoadingComplete?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-16 w-80 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl flex flex-col max-h-[calc(100vh-200px)] z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
        <h2 className="text-white font-semibold text-xs">Insights</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors text-xs" title="Close">
          ✕
        </button>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto flex-1 p-3 space-y-3 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-3 border-white/20 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-white/60 text-xs">Processing data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="text-white font-medium text-xs mb-1">Analysis Results</h3>
            </div>

            <div className="space-y-2">
              <div className="bg-white/5 border border-white/10 rounded p-2">
                <p className="text-white/60 text-xs">Anomalies Detected</p>
                <p className="text-white font-semibold text-sm">{results.anomalies}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded p-2">
                <p className="text-white/60 text-xs">Coverage</p>
                <p className="text-white font-semibold text-sm">{results.coverage}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded p-2">
                <p className="text-white/60 text-xs">Data Quality</p>
                <p className="text-white font-semibold text-sm">{results.quality}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded p-2">
                <p className="text-white/60 text-xs">Vegetation Index</p>
                <p className="text-white font-semibold text-sm">{results.vegetation}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded p-2">
                <p className="text-white/60 text-xs">Trend Analysis</p>
                <p className="text-white font-semibold text-sm">{results.trend}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
