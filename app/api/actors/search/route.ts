import { NextRequest, NextResponse } from 'next/server';
import { actors } from '@/lib/db_existing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const location = searchParams.get('location');
    const skills = searchParams.get('skills');
    
    if (!name && !location && !skills) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      );
    }
    
    let results = [];
    
    if (name) {
      // Search by name - try different patterns
      const searchTerms = [
        name,
        name.replace(/\s+/g, ''), // No spaces
        name.replace(/\s+/g, '%'), // SQL wildcard between words
        `%${name}%` // SQL wildcard around whole term
      ];
      for (const term of searchTerms) {
        try {
          const searchResults = await actors.search(term);
          if (searchResults && searchResults.length > 0) {
            results = searchResults;
            break;
          }
        } catch (error) {
          console.error(`Search error for term "${term}":`, error);
        }
      }
      
      // If no results from search, try getting all actors and filter
      if (results.length === 0) {
        try {
          const allActors = await actors.getAll(100, 0);
          results = allActors.filter(actor => 
            actor.name && actor.name.toLowerCase().includes(name.toLowerCase())
          );
        } catch (error) {
          console.error('Error getting all actors:', error);
        }
      }
    } else if (skills) {
      // Search by skills
      results = await actors.getBySkills(skills);
    } else {
      // For location or other searches, use general search
      results = await actors.search(location || '');
    }
    
    return NextResponse.json({
      actors: results,
      total: results.length
    });
    
  } catch (error) {
    console.error('Error searching actors:', error);
    return NextResponse.json(
      { error: 'Failed to search actors' },
      { status: 500 }
    );
  }
}