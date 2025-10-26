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
  // Security headers. In development, avoid applying to Next's static assets
  // so MIME issues from intermediaries don't block debugging.
  // Only apply security headers in production to avoid interfering
  // with dev servers/proxies that may mis-serve asset MIME types.
  headers: async () => {
    if (process.env.NODE_ENV !== 'production') {
      return []
    }
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
