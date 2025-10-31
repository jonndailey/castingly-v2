import { useState, useEffect } from 'react'
import useAuthStore from '@/lib/store/auth-store'

export interface ActorMediaEntry {
  id: string
  url: string | null
  signed_url: string | null
  thumbnail_url: string | null
  name: string
  size: number
  mime_type: string
  category: string
  uploaded_at: string
  metadata: Record<string, unknown>
  [key: string]: unknown
}

export interface ActorProfile {
  id: string
  name: string
  email: string
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  skills?: string[]
  performance_skills?: string[]
  languages?: string[]
  height?: string | null
  eye_color?: string | null
  hair_color?: string | null
  union?: string | null
  phone?: string | null
  age_range?: string | null
  website?: string | null
  instagram?: string | null
  twitter?: string | null
  profile_completion?: number
  resume_url?: string | null
  preferences?: {
    hideProfileCompletion?: boolean
  }
  media?: {
    headshots: ActorMediaEntry[]
    gallery: ActorMediaEntry[]
    resumes: ActorMediaEntry[]
    reels: ActorMediaEntry[]
    self_tapes: ActorMediaEntry[]
    voice_over: ActorMediaEntry[]
    documents: ActorMediaEntry[]
    other: ActorMediaEntry[]
    all: ActorMediaEntry[]
  }
}

// Simple in-memory cache to avoid spinners on quick navigations
const profileCache = new Map<string, { data: ActorProfile; ts: number }>()
const PROFILE_CACHE_TTL = 5_000 // 5s for more immediate UI feedback

export function useActorProfile(actorId?: string, options?: { includeMedia?: boolean }) {
  const { user, token } = useAuthStore()
  const seedOwner = !options?.includeMedia && user && (!actorId || String(actorId) === String(user.id))
  const seedProfile: ActorProfile | null = seedOwner
    ? {
        id: String(user!.id),
        email: user!.email,
        name: user!.name,
        avatar_url: (user as any).avatar_url || null,
        bio: null,
        skills: [],
        phone: null,
        website: null,
        instagram: null,
        twitter: null,
        age_range: null,
        height: null,
        eye_color: null,
        hair_color: null,
        resume_url: null,
        location: 'Los Angeles',
        profile_completion: 0,
        preferences: {},
      }
    : null
  const [profile, setProfile] = useState<ActorProfile | null>(seedProfile)
  const [loading, setLoading] = useState(!seedProfile)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = actorId || user?.id

        if (!id) {
          // Wait for auth store hydration instead of showing a hard error
          setError(null)
          setLoading(true)
          return
        }

        // Use cached value immediately if fresh
        const cacheKey = `${id}|m=${options?.includeMedia ? '1' : '0'}`
        const cached = profileCache.get(cacheKey)
        const now = Date.now()
        let seeded = false
        if (cached && now - cached.ts < PROFILE_CACHE_TTL) {
          setProfile(cached.data)
          setLoading(false)
          seeded = true
        } else {
          // Optimistic seed from auth store for owner views
          if (!options?.includeMedia && user && String(user.id) === String(id)) {
            const seed: any = {
              id: String(user.id),
              email: user.email,
              name: user.name,
              role: user.role,
              avatar_url: user.avatar_url || null,
              bio: null,
              skills: [],
              phone: null,
              website: null,
              instagram: null,
              twitter: null,
              age_range: null,
              height: null,
              eye_color: null,
              hair_color: null,
              resume_url: null,
              location: 'Los Angeles',
              profile_completion: 0,
              preferences: {},
            }
            setProfile(seed)
            setLoading(false)
            seeded = true
          } else {
            setLoading(true)
          }
        }

        const qs = new URLSearchParams()
        if (options?.includeMedia) qs.set('media', '1')
        const url = `/api/actors/${id}?${qs.toString()}${qs.toString() ? '&' : ''}ts=${Date.now()}`
        const response = await fetch(url, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
          cache: 'no-store',
        })
        if (!response.ok) {
          // Retry once on transient 401/403 after a short delay (store may not have token yet)
          if (response.status === 401 || response.status === 403) {
            await new Promise((r) => setTimeout(r, 300))
            const retry = await fetch(url, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              cache: 'no-store',
            })
            if (!retry.ok) throw new Error('Failed to fetch profile')
            const data = await retry.json()
            setProfile(data)
            const cacheKey = `${id}|m=${options?.includeMedia ? '1' : '0'}`
            profileCache.set(cacheKey, { data, ts: Date.now() })
            return
          }
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setProfile(data)
        profileCache.set(cacheKey, { data, ts: Date.now() })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [actorId, token, user?.id, options?.includeMedia, version])

  const refresh = () => setVersion((v) => v + 1)

  return { profile, loading, error, refresh }
}

export function useActorMedia(actorId?: string) {
  const { user, token } = useAuthStore()
  const [media, setMedia] = useState<ActorProfile['media'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const id = actorId || user?.id
        if (!id) {
          setError(null)
          setLoading(true)
          return
        }
        const url = `/api/actors/${id}?media=1&ts=${Date.now()}`
        const response = await fetch(url , {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        })
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            await new Promise((r) => setTimeout(r, 300))
            const retry = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' })
            if (!retry.ok) throw new Error('Failed to fetch media')
            const data = await retry.json()
            setMedia(data?.media ?? null)
            return
          }
          throw new Error('Failed to fetch media')
        }
        const data = await response.json()
        setMedia(data?.media ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load media')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [actorId, token, user?.id, tick])

  const reload = () => setTick((v) => v + 1)
  return { media, loading, error, reload }
}

export function useActors(params?: { 
  search?: string; 
  location?: string; 
  limit?: number; 
  offset?: number;
}) {
  const [actors, setActors] = useState<ActorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchActors = async () => {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set('search', params.search);
        if (params?.location) queryParams.set('location', params.location);
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.offset) queryParams.set('offset', params.offset.toString());
        
        const response = await fetch(`/api/actors?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch actors');
        }
        
        const data = await response.json();
        setActors(data.actors);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load actors');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActors();
  }, [params?.search, params?.location, params?.limit, params?.offset]);
  
  return { actors, total, loading, error };
}
