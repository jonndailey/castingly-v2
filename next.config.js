/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', '100.105.97.19', 'cloudinary.com', 'youtube.com', 'vimeo.com'],
  },
  // Serve static files from downloaded folders
  async rewrites() {
    return [
      {
        source: '/downloaded_images/:path*',
        destination: '/api/media/images/:path*',
      },
      {
        source: '/downloaded_resumes/:path*',
        destination: '/api/media/resumes/:path*',
      },
    ]
  },
  // Enable PWA features
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
}

module.exports = nextConfig