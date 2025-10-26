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
