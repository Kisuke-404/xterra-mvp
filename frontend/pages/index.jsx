import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

// Dynamically import Map to avoid SSR issues with Leaflet (client-only)
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

/**
 * Main landing page (Slide 1 from Figma)
 * - Dark theme, full-screen layout
 * - Navbar at top, collapsible Sidebar, full-screen Map
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>Xterra MVP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AI-powered mineral hotspot detection" />
      </Head>
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 h-full">
            <Map />
          </main>
        </div>
      </div>
    </>
  );
}


