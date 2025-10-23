import { obtainServiceToken as _obtain } from '@/lib/server/dmapi-service'

export async function obtainServiceToken(): Promise<string> {
  return _obtainServiceToken()
}

// Re-export internal obtainServiceToken from dmapi-service
async function _obtainServiceToken(): Promise<string> {
  // We import lazily to avoid circular deps
  const mod = await import('@/lib/server/dmapi-service')
  // @ts-ignore
  const fn = mod.obtainServiceToken as (force?: boolean) => Promise<string>
  return fn(false)
}

