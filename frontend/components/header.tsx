"use client"

import { useState } from "react"

interface HeaderProps {
  onDrawAOI: () => void
  onUploadAOI: () => void
  isDrawingMode: boolean
  onMenuToggle: () => void
}

export function Header({ onDrawAOI, onUploadAOI, isDrawingMode, onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notificationCount] = useState(3)

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center justify-between px-5 py-2.5">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu Button */}
          <button onClick={onMenuToggle} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Menu">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-white text-lg font-bold tracking-tight">Xterra</div>
        </div>

        {/* Center/Right: Action buttons and icons */}
        <div className="flex items-center gap-3">
          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Notifications"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-10 right-0 w-64 bg-slate-900 border border-white/10 rounded-lg shadow-xl p-4">
                <h3 className="text-white font-semibold mb-3">Notifications</h3>
                <div className="space-y-2">
                  <div className="bg-slate-800 p-2 rounded text-sm text-white/80">AOI upload successful</div>
                  <div className="bg-slate-800 p-2 rounded text-sm text-white/80">Map data updated</div>
                  <div className="bg-slate-800 p-2 rounded text-sm text-white/80">New analysis available</div>
                </div>
              </div>
            )}
          </div>

          {/* Help Icon */}
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Help">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Upload Data/AOI Button */}
          <button
            onClick={onUploadAOI}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-xs font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Upload Data/AOI
          </button>

          {/* Draw AOI Button */}
          <button
            onClick={onDrawAOI}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-xs font-medium ${
              isDrawingMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-slate-700 hover:bg-slate-600 text-white"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a6 6 0 016 6v4a6 6 0 016-6h4a2 2 0 012 2v12a4 4 0 01-4 4zm-9-15a3 3 0 015.996.001"
              />
            </svg>
            Draw AOI
          </button>

          {/* User Profile Icon */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="User Account"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm0 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute top-10 right-0 w-48 bg-slate-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <div className="text-sm text-white font-medium">User Account</div>
                  <div className="text-xs text-white/60">user@example.com</div>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-800 transition-colors">
                  Profile Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-800 transition-colors">
                  Preferences
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-800 transition-colors">
                  Help & Support
                </button>
                <div className="border-t border-white/10"></div>
                <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
