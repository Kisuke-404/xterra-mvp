import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';

/**
 * Leaflet map centered on Carlin Trend (Nevada)
 * - Uses OpenStreetMap tiles (no API key required)
 * - Client-side only rendering to avoid SSR issues
 */
export default function Map() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure map renders only in the browser
  }, []);

  const center = [40.7822, -116.2140]; // Carlin Trend

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-56px)]">
      <MapContainer
        center={center}
        zoom={8}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* TODO: Add drawing tools and AOI selection in future iteration */}
      </MapContainer>
    </div>
  );
}


