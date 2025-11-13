/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow common map tile providers (expand as needed)
    remotePatterns: [
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
      { protocol: 'https', hostname: '*.tile.openstreetmap.org' },
      { protocol: 'https', hostname: 'a.tile.openstreetmap.org' },
      { protocol: 'https', hostname: 'b.tile.openstreetmap.org' },
      { protocol: 'https', hostname: 'c.tile.openstreetmap.org' }
    ]
  }
};

module.exports = nextConfig;


