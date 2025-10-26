import { NextRequest } from 'next/server'
import { validateUserToken } from '@/lib/dmapi'
import jwt from 'jsonwebtoken'

export type RequestUser = {
  id: string
  email?: string
  role?: string
}

export async function getRequestUser(req: NextRequest): Promise<RequestUser | null> {
  const auth = req.headers.get('authorization')
  // Try Core token validation first
  const core = await validateUserToken(auth)
  if (core?.userId) {
    return { id: String(core.userId), email: core.email }
  }
  // Try legacy JWT fallback
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length)
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    try {
      const decoded = jwt.verify(token, secret) as any
      if (decoded?.id) {
        return { id: String(decoded.id), email: decoded.email, role: decoded.role }
      }
    } catch {}
  }
  return null
}

