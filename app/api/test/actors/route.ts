import { NextRequest, NextResponse } from 'next/server';
import { actors } from '@/lib/db_existing';

// Simple test endpoint to verify database connection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    const actorList = await actors.getAll(limit, 0);
    const count = await actors.getCount();
    
    return NextResponse.json({
      success: true,
      total_actors: count,
      sample_actors: actorList,
      message: 'Database connection successful!'
    });
  } catch (error) {
    console.error('Database test error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: message,
      message: 'Database connection failed'
    }, { status: 500 });
  }
}
