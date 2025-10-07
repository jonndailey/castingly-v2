import { NextRequest, NextResponse } from 'next/server';
import { actors } from '@/lib/db_existing';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const actor = await actors.getById(id);
    
    if (!actor) {
      return NextResponse.json(
        { error: 'Actor not found' },
        { status: 404 }
      );
    }
    
    // Get actor's media
    const media = await actors.getMedia(id);
    
    // Process skills - they're stored as comma-separated strings in existing DB
    let skillsArray = [];
    if (actor.skills && typeof actor.skills === 'string') {
      skillsArray = actor.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // Organize media by type
    const headshots = media.filter(m => m.media_type === 'headshot');
    const resumes = media.filter(m => m.media_type === 'resume');
    const reels = media.filter(m => m.media_type === 'reel');
    
    // Get primary headshot or use profile_image
    const primaryHeadshot = headshots.find(h => h.is_primary) || headshots[0];
    const avatar_url = primaryHeadshot?.media_url || actor.profile_image || null;
    
    return NextResponse.json({
      id: actor.id,
      email: actor.email,
      name: actor.name,
      role: actor.role,
      avatar_url,
      bio: actor.bio,
      skills: skillsArray,
      height: actor.height,
      eye_color: actor.eye_color,
      hair_color: actor.hair_color,
      profile_image: actor.profile_image,
      resume_url: actor.resume_url,
      location: actor.location || 'Los Angeles', // Default location
      media: {
        headshots,
        resumes,
        reels,
        all: media
      },
      // Additional computed fields
      profile_completion: actor.bio ? 75 : 25,
      created_at: actor.created_at,
      updated_at: actor.updated_at
    });
  } catch (error) {
    console.error('Error fetching actor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actor details' },
      { status: 500 }
    );
  }
}