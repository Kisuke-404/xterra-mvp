"use client"

import { useState, useEffect } from "react"

interface AOISearchProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (lat: number, lon: number, place: string) => void
  mapRef: any
}

export const AOISearch = ({ isOpen, onClose, onSearch, mapRef }: AOISearchProps) => {
  const [searchInput, setSearchInput] = useState("")
  const [recentSearches, setRecentSearches] = useState<Array<{ lat: number; lon: number; name: string }>>([])

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setRecentSearches(parsed)
        } catch (e) {
          console.error("Error loading recent searches:", e)
        }
      }
    }
  }, [isOpen])

  const saveRecentSearch = (lat: number, lon: number, place: string) => {
    if (typeof window === "undefined") return

    const newSearch = { lat, lon, name: place }
    const filtered = recentSearches.filter((s) => s.name !== place)
    const updated = [newSearch, ...filtered].slice(0, 3)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const handleSearch = async (input: string) => {
    if (!input.trim()) return

    let lat: number, lon: number, place: string

    const coordMatch = input.match(/^([-\d.]+)\s*,\s*([-\d.]+)$/)

    if (coordMatch) {
      lat = Number.parseFloat(coordMatch[1])
      lon = Number.parseFloat(coordMatch[2])
      place = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } else {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1`,
        )
        const data = await response.json()
        if (data.length === 0) {
          alert("Location not found")
          return
        }
        lat = Number.parseFloat(data[0].lat)
        lon = Number.parseFloat(data[0].lon)
        place = data[0].display_name || input
      } catch (error) {
        console.error("Geocoding error:", error)
        alert("Error searching location")
        return
      }
    }

    saveRecentSearch(lat, lon, place)
    onSearch(lat, lon, place)
    setSearchInput("")
  }

  const handleRecentSearch = (search: { lat: number; lon: number; name: string }) => {
    onSearch(search.lat, search.lon, search.name)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-16 w-64 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl p-3 z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-xs">AOI Search</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors" title="Close">
          ✕
        </button>
      </div>

      <div className="mb-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-2 w-3.5 h-3.5 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchInput)}
            placeholder="Search place or coordinate"
            className="w-full pl-9 pr-3 py-1 bg-white/10 border border-white/20 rounded-md text-white text-xs placeholder-white/40 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {recentSearches && recentSearches.length > 0 && (
        <div>
          <p className="text-white/60 text-xs font-semibold mb-1.5">Recent</p>
          <div className="space-y-0.5">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => handleRecentSearch(search)}
                className="w-full text-left px-2 py-1 text-white/70 text-xs hover:bg-white/5 rounded-md transition-colors flex items-center gap-1.5"
              >
                <span className="text-sm">📍</span>
                <span className="truncate">{search.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}