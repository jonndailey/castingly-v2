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
  media?: {
    headshots: ActorMediaEntry[]
    resumes: ActorMediaEntry[]
    reels: ActorMediaEntry[]
    self_tapes: ActorMediaEntry[]
    voice_over: ActorMediaEntry[]
    documents: ActorMediaEntry[]
    other: ActorMediaEntry[]
    all: ActorMediaEntry[]
  }
}

export function useActorProfile(actorId?: string) {
  const { user, token } = useAuthStore()
  const [profile, setProfile] = useState<ActorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const id = actorId || user?.id

        if (!id) {
          setError('No actor ID provided')
          return
        }

        const response = await fetch(`/api/actors/${id}`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load profile'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [actorId, token, user?.id])

  return { profile, loading, error }
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
