import Image from 'next/image';
import { useRouter } from 'next/router';

/**
 * Navbar with Xterra logo and three toolbar icons (Search, Data, Insights)
 * Icons are clickable placeholders; wire up actions later
 */
export default function Navbar() {
  const router = useRouter();

  const items = [
    { key: 'search', label: 'Search', icon: '🔎' },
    { key: 'data', label: 'Data', icon: '🗂️' },
    { key: 'insights', label: 'Insights', icon: '💡' }
  ];

  return (
    <header className="w-full border-b border-gray-800 bg-surface/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="font-bold text-black">X</span>
          </div>
          <span className="font-semibold tracking-wide">Xterra</span>
        </div>
        <nav className="flex items-center gap-2">
          {items.map((item) => (
            <button
              key={item.key}
              aria-label={item.label}
              onClick={() => router.push('/')}
              className="px-3 py-2 rounded-lg hover:bg-gray-800/60 transition flex items-center gap-2"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden sm:block text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}


