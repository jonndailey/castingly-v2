const dmapiBaseUrl =
  process.env.NEXT_PUBLIC_DMAPI_BASE_URL || process.env.DMAPI_BASE_URL

let dmapiDomain = null
if (dmapiBaseUrl) {
  try {
    dmapiDomain = new URL(dmapiBaseUrl).hostname
  } catch {
    dmapiDomain = null
  }
}

const imageDomains = new Set([
  'localhost',
  '100.105.97.19',
  'cloudinary.com',
  'youtube.com',
  'vimeo.com',
])

if (dmapiDomain) {
  imageDomains.add(dmapiDomain)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: Array.from(imageDomains),
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
