"use client"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ isOpen, onClose, activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "aois", label: "AOI's", icon: "📍" },
    { id: "projects", label: "Project's", icon: "📁" },
    { id: "workflows", label: "Workflows", icon: "⚙️" },
    { id: "marketplace", label: "Marketplace", icon: "🛒" },
    { id: "teams", label: "Teams", icon: "👥" },
    { id: "geoai", label: "GeoAI", icon: "🤖" },
    { id: "timelines", label: "Timelines", icon: "📊" },
  ]

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-14 bg-black/80 backdrop-blur-sm border-r border-white/10 z-40 transform transition-transform duration-300 py-0 w-48 h-[calc(100vh-3.5rem)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-3 gap-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id)
                onClose()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left text-sm border-l-4 ${
                activeView === item.id
                  ? "border-l-blue-500 text-white bg-white/5"
                  : "border-l-transparent text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
