# Xterra MVP Frontend

Dark-themed Next.js frontend with Leaflet map for the Xterra MVP.

## What it does
- Renders a full-screen Leaflet map centered on the Carlin Trend (Nevada)
- Provides a dark UI with Navbar and collapsible Sidebar
- Ready to connect to the backend API for mineral analysis

## Tech
- Next.js 13 (React 18)
- Tailwind CSS (Dark theme)
- Leaflet / react-leaflet (OpenStreetMap tiles)
- Axios (API requests)

## Getting Started
1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment:
Create a `.env.local` file in `frontend/` (see example keys below):
```
NEXT_PUBLIC_BACKEND_URL=https://xterra-mvp-production.up.railway.app
NEXT_PUBLIC_MAPBOX_TOKEN=
```
Note: Mapbox token is not required for the default OpenStreetMap tiles.

3. Run the dev server:
```bash
npm run dev
```
Visit `http://localhost:3000`.

## Production Build
```bash
npm run build
npm start
```

## Notes
- Map rendering is client-side only to avoid SSR issues with Leaflet.
- Icons and menu items are placeholders for now; wire them up to real flows next.


