import { NextRequest, NextResponse } from 'next/server';
import { actors } from '@/lib/db_existing';
import { resolveWebAvatarUrl } from '@/lib/image-url';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    
    let actorList;
    
    try {
      if (search) {
        actorList = await actors.search(search);
      } else if (location) {
        actorList = await actors.search(location);
      } else {
        actorList = await actors.getAll(limit, offset);
      }
    } catch (e) {
      console.warn('[actors] DB list failed; returning empty list:', (e as any)?.message || e)
      actorList = []
    }
    // Provide a stable avatar endpoint for clients; server resolves/persists pointers
    const safeActors = (actorList as any[]).map((a: any) => ({
      ...a,
      avatar_url: `/api/media/avatar/safe/${encodeURIComponent(String(a.id))}`
    }));

    // Get total count for pagination
    let totalCount = 0
    try {
      totalCount = await actors.getCount();
    } catch {
      totalCount = Array.isArray(actorList) ? actorList.length : 0
    }
    
    return NextResponse.json({
      actors: safeActors,
      total: totalCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching actors:', error);
    // Return a safe empty response to avoid breaking the UI on transient failures
    return NextResponse.json({ actors: [], total: 0, limit: 0, offset: 0 });
  }
}
