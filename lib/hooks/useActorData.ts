import { useState, useEffect } from 'react';
import useAuthStore from '@/lib/store/auth-store';

export interface ActorProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  performance_skills?: string[];
  languages?: string[];
  height?: string;
  eye_color?: string;
  hair_color?: string;
  profile_completion?: number;
  media?: Media[];
}

export interface Media {
  id: string;
  type: 'headshot' | 'resume' | 'reel' | 'clip' | 'self_tape';
  url: string;
  caption?: string;
  is_primary?: boolean;
  thumbnail_url?: string;
}

export function useActorProfile(actorId?: string) {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ActorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const id = actorId || user?.id;
        
        if (!id) {
          setError('No actor ID provided');
          return;
        }
        
        const response = await fetch(`/api/actors/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [actorId, user?.id]);
  
  return { profile, loading, error };
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