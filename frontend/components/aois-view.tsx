"use client"

import { useState } from "react"

interface AOI {
  id: string
  name: string
  location: string
  createdDate: string
  size: string
}

export function AOIsView() {
  const [aois] = useState<AOI[]>([
    {
      id: "aoi:1",
      name: "Carlin Trend North",
      location: "40.7822, -116.2140",
      createdDate: "2024-01-15",
      size: "250 km²",
    },
    {
      id: "aoi:2",
      name: "Carlin Trend South",
      location: "40.7500, -116.2000",
      createdDate: "2024-01-16",
      size: "180 km²",
    },
    {
      id: "aoi:3",
      name: "Exploration Zone",
      location: "40.8000, -116.1800",
      createdDate: "2024-01-17",
      size: "320 km²",
    },
  ])

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Areas of Interest</h2>

      <div className="overflow-x-auto bg-slate-900 rounded-lg border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-slate-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">AOI ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Created Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Size</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {aois.map((aoi) => (
              <tr key={aoi.id} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-3 text-sm text-white/70 font-mono">{aoi.id}</td>
                <td className="px-6 py-3 text-sm text-white">{aoi.name}</td>
                <td className="px-6 py-3 text-sm text-white/70">{aoi.location}</td>
                <td className="px-6 py-3 text-sm text-white/70">{aoi.createdDate}</td>
                <td className="px-6 py-3 text-sm text-white/70">{aoi.size}</td>
                <td className="px-6 py-3 text-sm">
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
