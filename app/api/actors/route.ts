import { NextRequest, NextResponse } from 'next/server';
import { actors } from '@/lib/db_existing';

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
      actorList = await actors.getByLocation(location);
    } else {
      actorList = await actors.getAll(limit, offset);
    }
    
    // Get total count for pagination
    const totalCount = await actors.getCount();
    
    return NextResponse.json({
      actors: actorList,
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