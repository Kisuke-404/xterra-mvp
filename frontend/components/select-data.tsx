"use client"

import { useState } from "react"

interface SelectDataProps {
  isOpen: boolean
  onClose: () => void
  onRunModel: (filters: any) => void
}

export function SelectData({ isOpen, onClose, onRunModel }: SelectDataProps) {
  const [fromDate, setFromDate] = useState("2025-11-06")
  const [toDate, setToDate] = useState("2025-11-13")
  const [satellites, setSatellites] = useState({
    "Sentinel-2": true,
    "Landsat-8": false,
    PRISMA: false,
  })
  const [otherDataTypes, setOtherDataTypes] = useState({
    Optical: false,
    SAR: false,
    DEM: false,
    Airborne: false,
  })
  const [selectedImages, setSelectedImages] = useState<number[]>([])

  // Mock available images
  const availableImages = [
    { id: 1, date: "12 Nov 2025", provider: "Sentinel-2", thumbnail: "S-2-1" },
    { id: 2, date: "11 Nov 2025", provider: "Landsat-8", thumbnail: "L-8-1" },
    { id: 3, date: "8 Nov 2025", provider: "Sentinel-2", thumbnail: "S-2-2" },
    { id: 4, date: "7 Nov 2025", provider: "Landsat-8", thumbnail: "L-8-2" },
    { id: 5, date: "5 Nov 2025", provider: "Sentinel-2", thumbnail: "S-2-3" },
  ]

  const toggleImage = (id: number) => {
    setSelectedImages((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleRunModel = () => {
    onRunModel({
      dateRange: { from: fromDate, to: toDate },
      satellites,
      otherDataTypes,
      selectedImages,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-16 w-80 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl flex flex-col max-h-[calc(100vh-200px)] z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
        <h2 className="text-white font-semibold text-xs">Select Data</h2>
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
        {/* Date Range */}
        <div>
          <h3 className="text-white font-medium text-xs mb-2">Date Range</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-blue-500/50"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Satellites/Providers */}
        <div>
          <h3 className="text-white font-medium text-xs mb-2">Satellites / Providers</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(satellites).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-white/70 text-xs cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSatellites({ ...satellites, [key]: e.target.checked })}
                  className="w-3 h-3"
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Other Data Types */}
        <div>
          <h3 className="text-white font-medium text-xs mb-2">Other Data Types</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(otherDataTypes).map(([key, value]) => (
              <label
                key={key}
                className="flex items-center gap-2 text-white/70 text-xs cursor-pointer hover:text-white"
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setOtherDataTypes({ ...otherDataTypes, [key]: e.target.checked })}
                  className="w-3 h-3"
                />
                <span>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Available Images */}
        <div className="w-full">
          <h3 className="text-white font-medium text-xs mb-2">Available Images</h3>
          <div className="space-y-1 w-full">
            {availableImages.map((img) => (
              <label
                key={img.id}
                className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 cursor-pointer transition-colors w-full"
              >
                <input
                  type="checkbox"
                  checked={selectedImages.includes(img.id)}
                  onChange={() => toggleImage(img.id)}
                  className="w-3 h-3 flex-shrink-0"
                />
                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-white/40 text-xs flex-shrink-0">
                  {img.thumbnail}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-white text-xs truncate">{img.date}</p>
                  <p className="text-white/60 text-xs truncate">{img.provider}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Run Model Button */}
      <div className="border-t border-white/10 p-3 flex justify-end flex-shrink-0">
        <button
          onClick={handleRunModel}
          className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-xs transition-colors"
        >
          Run Model
        </button>
      </div>
    </div>
  )
}
