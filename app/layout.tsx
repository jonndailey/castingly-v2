import type { Metadata, Viewport } from 'next'
import { ClientProvider } from '@/components/providers/client-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Castingly - Professional Casting Platform',
  description: 'Connect actors, agents, and casting directors in one seamless platform',
  keywords: 'casting, actors, agents, auditions, entertainment, film, television',
  authors: [{ name: 'Castingly' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#9C27B0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Improve image start-up by preconnecting to S3/DMAPI origins */}
        <link rel="preconnect" href="https://s3.us-east-va.io.cloud.ovh.us" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://s3.us-east-va.io.cloud.ovh.us" />
        <link rel="preconnect" href="https://media.dailey.cloud" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://media.dailey.cloud" />
      </head>
      <body className="h-full bg-gray-50 overflow-x-hidden">
        <ClientProvider>
          <div className="min-h-full">
            {children}
          </div>
        </ClientProvider>
      </body>
    </html>
  )
}
