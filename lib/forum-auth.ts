import { NextRequest } from 'next/server'
import { query } from '@/lib/db_mysql'
import { ForumUserContext } from '@/lib/forum'

function parseBoolean(value: string | null): boolean | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  const normalized = value.toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }
  return undefined
}

export async function resolveForumUser(request: NextRequest): Promise<ForumUserContext | null> {
  const contextHeader = request.headers.get('x-user-context')
  let headerContext: Partial<ForumUserContext> & { id?: string } = {}

  if (contextHeader) {
    try {
      const parsed = JSON.parse(contextHeader)
      headerContext = parsed
    } catch (error) {
      console.warn('Failed to parse x-user-context header:', error)
    }
  }

  const headerId = request.headers.get('x-user-id') || headerContext.id || undefined
  const headerRole = (request.headers.get('x-user-role') as ForumUserContext['role']) || headerContext.role
  const headerVerified = parseBoolean(request.headers.get('x-user-verified'))
  const headerInvestor = parseBoolean(request.headers.get('x-user-investor'))

  if (headerId) {
    try {
      const rows = await query(
        `SELECT id, role, is_verified_professional, is_investor
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [headerId]
      )

      if (Array.isArray(rows) && rows.length) {
        const row = rows[0] as any
        return {
          id: row.id,
          role: row.role,
          is_verified_professional: Boolean(
            row.is_verified_professional ?? headerVerified ?? false
          ),
          is_investor: Boolean(row.is_investor ?? headerInvestor ?? false)
        }
      }
    } catch (error) {
      console.warn('Forum user DB lookup failed, falling back to header context:', (error as any)?.message || error)
    }

    if (headerRole) {
      return {
        id: headerId,
        role: headerRole,
        is_verified_professional: headerVerified ?? headerContext.is_verified_professional,
        is_investor: headerInvestor ?? headerContext.is_investor
      } as ForumUserContext
    }
  }

  if (headerRole) {
    return {
      id: headerContext.id || 'anonymous',
      role: headerRole,
      is_verified_professional: headerVerified ?? headerContext.is_verified_professional,
      is_investor: headerInvestor ?? headerContext.is_investor
    } as ForumUserContext
  }

  return null
}
