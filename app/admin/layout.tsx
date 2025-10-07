import { Metadata } from 'next'
import AdminProvider from './admin-provider'

export const metadata: Metadata = {
  title: 'Admin Panel - Castingly',
  description: 'Administrative interface for Castingly platform management',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      {children}
    </AdminProvider>
  )
}