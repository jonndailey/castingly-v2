import mysql from 'mysql2/promise'

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}

export interface AuditLogEntry {
  adminId: number
  action: string
  resourceType: string
  resourceId?: number
  targetUserId?: number
  details: string
  ipAddress: string
  userAgent?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const connection = await mysql.createConnection(dbConfig)
      
      await connection.execute(`
        INSERT INTO audit_logs (
          admin_id, action, resource_type, resource_id, target_user_id,
          details, ip_address, user_agent, severity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        entry.adminId,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.targetUserId || null,
        entry.details,
        entry.ipAddress,
        entry.userAgent || null,
        entry.severity || 'medium'
      ])
      
      await connection.end()
    } catch (error) {
      console.error('Failed to log audit entry:', error)
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Convenience methods for common actions
  static async logUserAction(
    adminId: number,
    action: 'create' | 'update' | 'delete' | 'view',
    targetUserId: number,
    details: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    const severity = action === 'delete' ? 'high' : action === 'update' ? 'medium' : 'low'
    
    await this.log({
      adminId,
      action,
      resourceType: 'user',
      resourceId: targetUserId,
      targetUserId,
      details,
      ipAddress,
      userAgent,
      severity
    })
  }

  static async logSystemAction(
    adminId: number,
    action: string,
    details: string,
    ipAddress: string,
    userAgent?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.log({
      adminId,
      action,
      resourceType: 'system',
      details,
      ipAddress,
      userAgent,
      severity
    })
  }

  static async logLoginAction(
    adminId: number,
    action: 'login' | 'logout',
    ipAddress: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    const severity = success ? 'low' : 'medium'
    const details = success 
      ? `Admin ${action} successful`
      : `Admin ${action} failed`

    await this.log({
      adminId,
      action,
      resourceType: 'authentication',
      details,
      ipAddress,
      userAgent,
      severity
    })
  }

  static async logBulkAction(
    adminId: number,
    action: string,
    resourceType: string,
    count: number,
    details: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    const severity = action.includes('delete') ? 'high' : 'medium'
    
    await this.log({
      adminId,
      action: `bulk_${action}`,
      resourceType,
      details: `${details} (${count} items affected)`,
      ipAddress,
      userAgent,
      severity
    })
  }
}

// Helper function to extract IP address from request headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || '127.0.0.1'
}

// Helper function to get user agent
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'Unknown'
}