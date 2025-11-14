"use client"

import { useEffect, useState } from "react"

interface InsightsProps {
  isOpen: boolean
  onClose: () => void
  onLoadingComplete?: () => void
}

// Type definition for section keys to ensure type safety
type SectionKey = "findings" | "evidence" | "quality" | "recommendations"

export function Insights({ isOpen, onClose, onLoadingComplete }: InsightsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<any>(null)
  const [expandedSections, setExpandedSections] = useState({
    findings: true,
    evidence: true,
    quality: true,
    recommendations: true,
  })

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        setResults({
          targetCount: 3,
          primaryMineral: "Copper (Cu)",
          confidence: "87%",
          recommendedDepth: "150-300m",
          magneticAnomaly: "+245 nT",
          hyperspectral: "Copper Oxide Minerals",
          topographic: "Favorable (150m relief)",
          coverage: "92%",
          quality: "High",
          cloudCover: "2%",
          dataAge: "14 days",
          geologicalRisk: "Low-Medium",
          environmentalFactors: "Favorable",
          nextSteps: "Ground-truthing survey",
          bestSeason: "Q2-Q3",
          timeline: "3-6 months",
        })
        onLoadingComplete?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Toggle the expanded state of a specific section
  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Component for section headers with expand/collapse functionality
  const SectionHeader = ({ title, icon, section }: { title: string; icon: string; section: SectionKey }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-white font-semibold text-xs">{title}</h3>
      </div>
      <span className="text-white/60 text-xs">{expandedSections[section] ? "▼" : "▶"}</span>
    </button>
  )

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-start gap-2 py-1.5 px-2 bg-black/30 rounded border border-white/5">
      <p className="text-white/60 text-xs font-medium">{label}</p>
      <p className="text-white text-xs font-semibold text-right">{value}</p>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-16 w-96 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl flex flex-col max-h-[calc(100vh-200px)] z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0 bg-black/50">
        <h2 className="text-white font-semibold text-sm">📊 Analysis Insights</h2>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors text-xs" title="Close">
          ✕
        </button>
      </div>

      {/* Content */}
      <div
        className="overflow-y-auto flex-1 p-3 space-y-2.5 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-3 border-white/20 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-white/60 text-xs">Processing geological data...</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* PRIMARY FINDINGS */}
            <div>
              <SectionHeader title="Primary Findings" icon="🎯" section="findings" />
              {expandedSections.findings && (
                <div className="mt-2 space-y-1.5 pl-1">
                  <InfoCard label="Mineral Targets" value={`${results.targetCount} identified`} />
                  <InfoCard label="Primary Mineral" value={results.primaryMineral} />
                  <InfoCard label="Confidence Level" value={results.confidence} />
                  <InfoCard label="Recommended Depth" value={results.recommendedDepth} />
                </div>
              )}
            </div>

            {/* GEOLOGICAL EVIDENCE */}
            <div>
              <SectionHeader title="Geological Evidence" icon="🧪" section="evidence" />
              {expandedSections.evidence && (
                <div className="mt-2 space-y-1.5 pl-1">
                  <InfoCard label="Magnetic Anomaly" value={results.magneticAnomaly} />
                  <InfoCard label="Hyperspectral Signature" value={results.hyperspectral} />
                  <InfoCard label="Topographic Relief" value={results.topographic} />
                </div>
              )}
            </div>

            {/* DATA QUALITY */}
            <div>
              <SectionHeader title="Data Quality Assessment" icon="📊" section="quality" />
              {expandedSections.quality && (
                <div className="mt-2 space-y-1.5 pl-1">
                  <InfoCard label="Coverage" value={results.coverage} />
                  <InfoCard label="Image Quality" value={results.quality} />
                  <InfoCard label="Cloud Cover" value={results.cloudCover} />
                  <InfoCard label="Data Age" value={results.dataAge} />
                </div>
              )}
            </div>

            {/* RISK & RECOMMENDATIONS */}
            <div>
              <SectionHeader title="Risk & Recommendations" icon="💡" section="recommendations" />
              {expandedSections.recommendations && (
                <div className="mt-2 space-y-1.5 pl-1">
                  <InfoCard label="Geological Risk" value={results.geologicalRisk} />
                  <InfoCard label="Environmental Factors" value={results.environmentalFactors} />
                  <InfoCard label="Next Steps" value={results.nextSteps} />
                  <InfoCard label="Best Season" value={results.bestSeason} />
                  <InfoCard label="Timeline" value={results.timeline} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-2 bg-black/50 flex gap-1 flex-shrink-0">
        <button className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-xs transition-colors">
          📥 Export
        </button>
        <button className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-white text-xs transition-colors">
          🖨️ Print
        </button>
      </div>
    </div>
  )
}