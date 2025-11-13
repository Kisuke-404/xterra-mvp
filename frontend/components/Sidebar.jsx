import { useState } from 'react';

/**
 * Collapsible left sidebar with navigation items
 * Matches dark styling; items are placeholders for now
 */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    'Home',
    "AOI's",
    'Projects',
    'Workflow',
    'Marketplace',
    'Teams',
    'Geo AI',
    'Timelines'
  ];

  return (
    <aside
      className={`h-[calc(100vh-56px)] border-r border-gray-800 bg-surface p-3 transition-all duration-200 overflow-y-auto ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <button
        className="w-full mb-4 py-2 text-xs uppercase tracking-wide bg-gray-800 rounded-lg hover:bg-gray-700"
        onClick={() => setCollapsed((v) => !v)}
      >
        {collapsed ? '›' : '‹ Collapse'}
      </button>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800/60"
            title={item}
          >
            {collapsed ? item[0] : item}
          </button>
        ))}
      </nav>
    </aside>
  );
}


