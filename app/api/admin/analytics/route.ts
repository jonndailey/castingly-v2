import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'
    
    // Convert timeframe to days
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : 30

    const connection = await mysql.createConnection(dbConfig)

    // User Growth Metrics
    const [totalUsersResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users'
    ) as any

    const [newUsersThisWeekResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    const [newUsersLastWeekResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    const [newUsersThisMonthResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ) as any

    const [newUsersLastMonthResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ) as any

    // Calculate growth rate
    const thisMonth = newUsersThisMonthResult[0].total
    const lastMonth = newUsersLastMonthResult[0].total
    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

    // User Activity Metrics
    const [activeTodayResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 1 DAY)'
    ) as any

    const [activeThisWeekResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    ) as any

    const [activeThisMonthResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    ) as any

    // User Distribution by Role
    const [userDistributionResult] = await connection.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      GROUP BY role
    `) as any

    const userDistribution = {
      actors: 0,
      agents: 0,
      castingDirectors: 0,
      admins: 0
    }

    userDistributionResult.forEach((row: any) => {
      switch (row.role) {
        case 'actor':
          userDistribution.actors = row.count
          break
        case 'agent':
          userDistribution.agents = row.count
          break
        case 'casting_director':
          userDistribution.castingDirectors = row.count
          break
        case 'admin':
          userDistribution.admins = row.count
          break
      }
    })

    // Mock engagement data - in a real app, you'd have actual tracking tables
    const engagement = {
      profileViews: Math.floor(Math.random() * 10000) + 5000,
      submissions: Math.floor(Math.random() * 2000) + 1000,
      messages: Math.floor(Math.random() * 5000) + 2500,
      logins: activeThisMonthResult[0].total
    }

    // Most viewed profiles (mock data - you'd have actual analytics tables)
    const [mostViewedProfilesResult] = await connection.execute(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.role,
        FLOOR(RAND() * 500) + 50 as views
      FROM users u 
      WHERE u.role = 'actor'
      ORDER BY views DESC
      LIMIT 5
    `) as any

    // Most active users (based on recent logins)
    const [mostActiveUsersResult] = await connection.execute(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        DATE_FORMAT(u.last_login, '%M %d, %Y') as lastLogin,
        DATEDIFF(NOW(), u.last_login) as daysSinceLogin,
        (100 - DATEDIFF(NOW(), u.last_login)) as activityScore
      FROM users u 
      WHERE u.last_login IS NOT NULL
      ORDER BY u.last_login DESC
      LIMIT 5
    `) as any

    await connection.end()

    const analyticsData = {
      userGrowth: {
        totalUsers: totalUsersResult[0].total,
        newUsersThisWeek: newUsersThisWeekResult[0].total,
        newUsersLastWeek: newUsersLastWeekResult[0].total,
        newUsersThisMonth: newUsersThisMonthResult[0].total,
        newUsersLastMonth: newUsersLastMonthResult[0].total,
        growthRate: Math.round(growthRate * 10) / 10
      },
      userActivity: {
        activeToday: activeTodayResult[0].total,
        activeThisWeek: activeThisWeekResult[0].total,
        activeThisMonth: activeThisMonthResult[0].total,
        averageSessionTime: '12m',
        totalSessions: Math.floor(activeThisMonthResult[0].total * 2.3)
      },
      userDistribution,
      engagement,
      topContent: {
        mostViewedProfiles: mostViewedProfilesResult,
        mostActiveUsers: mostActiveUsersResult.map((user: any) => ({
          ...user,
          activityScore: Math.max(0, user.activityScore)
        }))
      }
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}