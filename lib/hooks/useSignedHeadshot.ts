import { useEffect, useState } from 'react'
import useAuthStore from '@/lib/store/auth-store'

/**
 * Returns a signed or public URL for the caller's headshot (if any).
 * Only works for the owner (uses caller's token).
 */
export function useSignedHeadshot(actorId?: string) {
  const { user, token } = useAuthStore()
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        if (!user?.id || !token) return
        if (actorId && String(actorId) !== String(user.id)) return
        const res = await fetch(`/api/media/list?category=headshot&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const files = Array.isArray(data?.files) ? data.files : []
        const first = files[0]
        // Prefer stable edge-cached serve URL when available
        const u = first?.url || first?.thumbnail_url || first?.signed_url || first?.public_url || null
        if (!cancelled) setUrl(typeof u === 'string' ? u : null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [actorId, user?.id, token])

  return { url, loading }
}
