import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import os from 'os'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function GET() {
  try {
    const startTime = Date.now()

    // Test database connection
    let databaseHealth: {
      status: 'connected' | 'disconnected' | 'slow'
      connections: number
      maxConnections: number
      responseTime: number
      uptime: string
    } = {
      status: 'connected',
      connections: 0,
      maxConnections: 100,
      responseTime: 0,
      uptime: '0 days'
    }

    try {
      const connection = await mysql.createConnection(dbConfig)
      const dbStartTime = Date.now()
      
      // Test query to check database responsiveness
      await connection.execute('SELECT 1')
      
      // Get database stats
      const [connectionStats] = await connection.execute(
        'SHOW STATUS WHERE Variable_name = "Threads_connected"'
      ) as any
      
      const [maxConnectionStats] = await connection.execute(
        'SHOW VARIABLES WHERE Variable_name = "max_connections"'
      ) as any

      const [uptimeStats] = await connection.execute(
        'SHOW STATUS WHERE Variable_name = "Uptime"'
      ) as any

      await connection.end()

      const dbResponseTime = Date.now() - dbStartTime
      const uptimeSeconds = parseInt(uptimeStats[0]?.Value || '0')
      const uptimeDays = Math.floor(uptimeSeconds / (24 * 60 * 60))

      databaseHealth = {
        status: dbResponseTime > 1000 ? 'slow' : 'connected',
        connections: parseInt(connectionStats[0]?.Value || '0'),
        maxConnections: parseInt(maxConnectionStats[0]?.Value || '100'),
        responseTime: dbResponseTime,
        uptime: `${uptimeDays} days`
      }
    } catch (error) {
      databaseHealth.status = 'disconnected'
    }

    // Get server metrics
    const cpuUsage = Math.random() * 30 + 10 // Mock CPU usage 10-40%
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100
    const loadAverage = os.loadavg()
    const uptime = os.uptime()
    const uptimeDays = Math.floor(uptime / (24 * 60 * 60))

    const serverHealth = {
      status: cpuUsage > 80 ? 'overloaded' : memoryUsage > 90 ? 'overloaded' : 'running' as const,
      cpu: cpuUsage,
      memory: memoryUsage,
      diskSpace: Math.random() * 20 + 30, // Mock disk usage 30-50%
      uptime: `${uptimeDays} days`,
      loadAverage: loadAverage.map(load => Math.round(load * 100) / 100)
    }

    // Network health (mocked)
    const networkLatency = Math.random() * 50 + 10 // 10-60ms
    const networkHealth = {
      status: networkLatency > 100 ? 'slow' : 'online' as const,
      latency: Math.round(networkLatency),
      bandwidth: '1 Gbps',
      activeConnections: Math.floor(Math.random() * 50) + 20
    }

    // Application metrics
    let activeUsers = 0
    try {
      const connection = await mysql.createConnection(dbConfig)
      const [activeUsersResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
      ) as any
      activeUsers = activeUsersResult[0]?.count || 0
      await connection.end()
    } catch (error) {
      // Use fallback value
    }

    const applicationHealth = {
      version: '2.0.0-beta',
      environment: process.env.NODE_ENV || 'development',
      activeUsers,
      requestsPerMinute: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 2, // 0-2% error rate
      averageResponseTime: Math.floor(Math.random() * 200) + 100 // 100-300ms
    }

    // Mock services
    const services = [
      {
        name: 'Authentication Service',
        status: 'running' as const,
        uptime: '15 days',
        lastCheck: new Date().toLocaleTimeString()
      },
      {
        name: 'File Upload Service',
        status: 'running' as const,
        uptime: '15 days',
        lastCheck: new Date().toLocaleTimeString()
      },
      {
        name: 'Email Service',
        status: 'running' as const,
        uptime: '15 days',
        lastCheck: new Date().toLocaleTimeString()
      },
      {
        name: 'Search Service',
        status: 'running' as const,
        uptime: '12 days',
        lastCheck: new Date().toLocaleTimeString()
      }
    ]

    // Mock recent alerts
    const alerts = [
      {
        id: 1,
        type: 'warning' as const,
        message: 'High memory usage detected on server',
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        resolved: true
      },
      {
        id: 2,
        type: 'info' as const,
        message: 'Database backup completed successfully',
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        resolved: true
      },
      {
        id: 3,
        type: 'error' as const,
        message: 'Failed authentication attempts from suspicious IP',
        timestamp: new Date(Date.now() - 10800000).toLocaleString(),
        resolved: false
      }
    ]

    // Determine overall system status
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (databaseHealth.status === 'disconnected' || 
        serverHealth.status === 'overloaded' || 
        networkHealth.status === 'offline') {
      overallStatus = 'critical'
    } else if (databaseHealth.status === 'slow' || 
               serverHealth.cpu > 70 || 
               serverHealth.memory > 85 ||
               networkHealth.status === 'slow' ||
               applicationHealth.errorRate > 1) {
      overallStatus = 'warning'
    }

    const systemHealth = {
      status: overallStatus,
      database: databaseHealth,
      server: serverHealth,
      network: networkHealth,
      application: applicationHealth,
      services,
      alerts
    }

    return NextResponse.json(systemHealth)
  } catch (error) {
    console.error('Failed to fetch system health:', error)
    return NextResponse.json(
      { 
        status: 'critical',
        error: 'Failed to fetch system health data' 
      },
      { status: 500 }
    )
  }
}
