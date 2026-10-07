/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/chat', destination: '/' },
      { source: '/projects', destination: '/' },
      { source: '/connectors', destination: '/' },
      { source: '/personalization', destination: '/' },
      { source: '/settings', destination: '/' },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
