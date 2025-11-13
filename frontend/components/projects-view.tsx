"use client"

import { useState } from "react"

interface Project {
  id: string
  name: string
  location: string
  createdDate: string
  aoiAssigned: string
  status: string
}

export function ProjectsView() {
  const [projects] = useState<Project[]>([
    {
      id: "proj:1",
      name: "Carlin Project",
      location: "40.7822, -116.2140",
      createdDate: "2024-01-15",
      aoiAssigned: "aoi:1",
      status: "Active",
    },
    {
      id: "proj:2",
      name: "Expansion Study",
      location: "40.7500, -116.2000",
      createdDate: "2024-01-16",
      aoiAssigned: "aoi:2",
      status: "Active",
    },
    {
      id: "proj:3",
      name: "Resource Assessment",
      location: "40.8000, -116.1800",
      createdDate: "2024-01-17",
      aoiAssigned: "aoi:3",
      status: "Pending",
    },
  ])

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-white">Projects</h2>

      <div className="overflow-x-auto bg-slate-900 rounded-lg border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-slate-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Project ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">AOI Assigned</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Created Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-3 text-sm text-white/70 font-mono">{project.id}</td>
                <td className="px-6 py-3 text-sm text-white">{project.name}</td>
                <td className="px-6 py-3 text-sm text-white/70">{project.location}</td>
                <td className="px-6 py-3 text-sm text-white/70 font-mono">{project.aoiAssigned}</td>
                <td className="px-6 py-3 text-sm text-white/70">{project.createdDate}</td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === "Active"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-yellow-900/30 text-yellow-400"
                    }`}
                  >
                    {project.status}
                  </span>
                </td>
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
