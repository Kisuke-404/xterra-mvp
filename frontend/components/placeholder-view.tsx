"use client"

interface PlaceholderViewProps {
  title: string
  icon: string
}

export function PlaceholderView({ title, icon }: PlaceholderViewProps) {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-white/60 text-center max-w-md">
        This feature is coming soon. Check back later for exciting updates!
      </p>
    </div>
  )
}
