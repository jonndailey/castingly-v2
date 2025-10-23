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
    
    if (search) {
      actorList = await actors.search(search);
    } else if (location) {
      actorList = await actors.search(location);
    } else {
      actorList = await actors.getAll(limit, offset);
    }
    // Sanitize avatar URLs to avoid local filesystem paths
    const safeActors = (actorList as any[]).map((a: any) => ({
      ...a,
      avatar_url: resolveWebAvatarUrl(a.avatar_url, a.name)
    }));

    // Get total count for pagination
    const totalCount = await actors.getCount();
    
    return NextResponse.json({
      actors: safeActors,
      total: totalCount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actors' },
      { status: 500 }
    );
  }
}
