'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Server, 
  Database,
  Wifi,
  HardDrive,
  Cpu,
  Memory,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Users,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  database: {
    status: 'connected' | 'disconnected' | 'slow'
    connections: number
    maxConnections: number
    responseTime: number
    uptime: string
  }
  server: {
    status: 'running' | 'overloaded' | 'down'
    cpu: number
    memory: number
    diskSpace: number
    uptime: string
    loadAverage: number[]
  }
  network: {
    status: 'online' | 'slow' | 'offline'
    latency: number
    bandwidth: string
    activeConnections: number
  }
  application: {
    version: string
    environment: string
    activeUsers: number
    requestsPerMinute: number
    errorRate: number
    averageResponseTime: number
  }
  services: Array<{
    name: string
    status: 'running' | 'stopped' | 'error'
    uptime: string
    lastCheck: string
  }>
  alerts: Array<{
    id: number
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: string
    resolved: boolean
  }>
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchSystemHealth()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemHealth()
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
      case 'online':
        return 'text-green-600'
      case 'warning':
      case 'slow':
      case 'overloaded':
        return 'text-yellow-600'
      case 'critical':
      case 'disconnected':
      case 'down':
      case 'offline':
      case 'stopped':
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
      case 'slow':
      case 'overloaded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical':
      case 'disconnected':
      case 'down':
      case 'offline':
      case 'stopped':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health</h1>
            <p className="text-gray-600">Monitor system status and performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <Button
              onClick={fetchSystemHealth}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        {health && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    {getStatusIcon(health.status)}
                    <h2 className={`text-2xl font-bold ml-3 ${getStatusColor(health.status)}`}>
                      System {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    All critical systems are {health.status === 'healthy' ? 'operating normally' : 
                    health.status === 'warning' ? 'experiencing minor issues' : 'experiencing critical issues'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Components */}
        {health && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(health.database.status)}
                      <span className={getStatusColor(health.database.status)}>
                        {health.database.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Connections</span>
                    <span>{health.database.connections}/{health.database.maxConnections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Response Time</span>
                    <span>{health.database.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uptime</span>
                    <span>{health.database.uptime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Server
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(health.server.status)}
                      <span className={getStatusColor(health.server.status)}>
                        {health.server.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CPU Usage</span>
                    <span>{formatPercentage(health.server.cpu)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Memory Usage</span>
                    <span>{formatPercentage(health.server.memory)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Disk Usage</span>
                    <span>{formatPercentage(health.server.diskSpace)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Load Average</span>
                    <span>{health.server.loadAverage.join(', ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Network Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(health.network.status)}
                      <span className={getStatusColor(health.network.status)}>
                        {health.network.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Latency</span>
                    <span>{health.network.latency}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bandwidth</span>
                    <span>{health.network.bandwidth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Connections</span>
                    <span>{health.network.activeConnections}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Version</span>
                    <span>{health.application.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Environment</span>
                    <span className="capitalize">{health.application.environment}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Users</span>
                    <span>{health.application.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Requests/min</span>
                    <span>{health.application.requestsPerMinute}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Error Rate</span>
                    <span className={health.application.errorRate > 5 ? 'text-red-600' : 'text-green-600'}>
                      {formatPercentage(health.application.errorRate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Response</span>
                    <span>{health.application.averageResponseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Services Status */}
        {health && health.services.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Services Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {health.services.map((service, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{service.name}</span>
                      {getStatusIcon(service.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Uptime: {service.uptime}</div>
                      <div>Last Check: {service.lastCheck}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Alerts */}
        {health && health.alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {health.alerts.slice(0, 10).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'error' ? 'border-red-500 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    } ${alert.resolved ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {alert.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                          {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                          {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                          <span className="font-medium text-sm">
                            {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                          </span>
                          {alert.resolved && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}