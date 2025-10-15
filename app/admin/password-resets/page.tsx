'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  Mail,
  Calendar,
  User,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PasswordResetRequest {
  id: number
  user_id: number
  user_name: string
  user_email: string
  token: string
  created_at: string
  expires_at: string
  used: boolean
  used_at: string | null
  ip_address?: string
  user_agent?: string
}

interface PasswordResetStats {
  totalRequests: number
  pendingRequests: number
  usedRequests: number
  expiredRequests: number
  requestsToday: number
  requestsThisWeek: number
}

export default function PasswordResetsPage() {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [stats, setStats] = useState<PasswordResetStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPasswordResets = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
      })

      const response = await fetch(`/api/admin/password-resets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch password resets:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/password-resets/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch password reset stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchPasswordResets()
    fetchStats()
  }, [fetchPasswordResets, fetchStats])

  const revokeToken = async (tokenId: number) => {
    try {
      const response = await fetch(`/api/admin/password-resets/${tokenId}/revoke`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchPasswordResets()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to revoke token:', error)
    }
  }

  const getStatusColor = (request: PasswordResetRequest) => {
    if (request.used) return 'bg-green-100 text-green-800'
    if (new Date(request.expires_at) < new Date()) return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (request: PasswordResetRequest) => {
    if (request.used) return 'Used'
    if (new Date(request.expires_at) < new Date()) return 'Expired'
    return 'Pending'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const timeUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Management</h1>
          <p className="text-gray-600">Monitor and manage password reset requests</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Key className="w-6 h-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-lg font-bold text-gray-900">{stats.totalRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-lg font-bold text-gray-900">{stats.pendingRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Used</p>
                    <p className="text-lg font-bold text-gray-900">{stats.usedRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <XCircle className="w-6 h-6 text-red-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Expired</p>
                    <p className="text-lg font-bold text-gray-900">{stats.expiredRequests}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Today</p>
                    <p className="text-lg font-bold text-gray-900">{stats.requestsToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <RefreshCw className="w-6 h-6 text-indigo-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-lg font-bold text-gray-900">{stats.requestsThisWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by user email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="used">Used</option>
                  <option value="expired">Expired</option>
                </select>

                <Button
                  onClick={() => {
                    fetchPasswordResets()
                    fetchStats()
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Requested</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Expires</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Used</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <User className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">{request.user_name}</p>
                              <p className="text-sm text-gray-600">{request.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request)}`}>
                            {getStatusText(request)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <p className="text-gray-900">{formatDate(request.expires_at)}</p>
                            {!request.used && (
                              <p className="text-xs text-gray-500">
                                {timeUntilExpiry(request.expires_at)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {request.used ? formatDate(request.used_at!) : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {!request.used && new Date(request.expires_at) > new Date() && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => revokeToken(request.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Revoke
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>

                {requests.length === 0 && (
                  <div className="text-center py-12">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No password reset requests found</p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
