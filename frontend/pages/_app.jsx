import '@/styles/globals.css';
import 'leaflet/dist/leaflet.css';

/**
 * Next.js custom App component
 * - Applies global styles
 * - Wraps all pages in a dark theme
 */
export default function App({ Component, pageProps }) {
  return (
    <div className="dark bg-background min-h-screen text-gray-100">
      <Component {...pageProps} />
    </div>
  );
}


