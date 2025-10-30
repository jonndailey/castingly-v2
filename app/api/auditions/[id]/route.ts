import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auditionId } = await params

    // Try to fetch from database first
    try {
      const result = await query(
        `SELECT * FROM auditions WHERE id = ?`,
        [auditionId]
      )

      if (result.rows && result.rows.length > 0) {
        const audition = result.rows[0]
        
        // Transform database row to API response format
        return NextResponse.json({
          id: audition.id,
          project: {
            title: audition.project_title,
            type: audition.project_type,
            network: audition.network,
            genre: audition.project_genre,
            synopsis: audition.project_synopsis,
            productionCompany: audition.production_company,
            shootingDates: audition.shooting_dates,
            location: audition.shooting_location
          },
          role: {
            name: audition.role_name,
            type: audition.role_type,
            ageRange: audition.age_range,
            ethnicity: audition.ethnicity,
            gender: audition.gender,
            description: audition.role_description,
            scenes: audition.screen_time,
            rate: audition.rate
          },
          auditionDetails: {
            type: audition.audition_type,
            round: audition.audition_round,
            date: audition.audition_date,
            time: audition.audition_time,
            duration: `${audition.duration_minutes} minutes`,
            format: audition.format,
            location: audition.location_venue ? {
              venue: audition.location_venue,
              address: audition.location_address,
              city: audition.location_city,
              state: audition.location_state,
              zip: audition.location_zip,
              room: audition.location_room,
              floor: audition.location_floor,
              parking: audition.location_parking,
              publicTransit: audition.location_transit
            } : undefined
          },
          castingTeam: {
            castingDirector: {
              name: audition.casting_director,
              company: audition.casting_company,
              email: audition.casting_email,
              phone: audition.casting_phone
            }
          },
          requirements: {
            sides: audition.sides_available ? {
              available: true,
              pages: audition.sides_pages,
              downloadUrl: '#',
              scenes: audition.sides_scenes ? [audition.sides_scenes] : [],
              dueDate: audition.preparation_notes || 'Please prepare all sides'
            } : undefined,
            wardrobe: audition.wardrobe_notes,
            preparation: audition.preparation_notes ? audition.preparation_notes.split('|') : [],
            brings: audition.bring_items ? audition.bring_items.split('|') : []
          },
          status: audition.status,
          notes: audition.casting_notes
        })
      }
    } catch (dbError) {
      console.log('Database fetch failed, returning mock data:', dbError)
    }

    // Fallback to mock data if database fetch fails or no data found
    if (true) {
      // Return mock data for demo purposes if no real data exists
      return NextResponse.json({
        id: auditionId,
        project: {
          title: 'City Lights Season 2',
          type: 'TV Series',
          network: 'HBO Max',
          genre: 'Crime Drama',
          synopsis: 'A gritty crime drama following detectives in Atlanta.',
          productionCompany: 'Peachtree Productions',
          shootingDates: 'March 2025 - August 2025',
          location: 'Atlanta, GA'
        },
        role: {
          name: 'Detective Marcus Williams',
          type: 'Series Regular',
          ageRange: '35-45',
          ethnicity: 'Open',
          gender: 'Male',
          description: 'A seasoned detective with a troubled past.',
          scenes: 'Approximately 8 episodes',
          rate: 'SAG-AFTRA Scale + 10%'
        },
        auditionDetails: {
          type: 'Callback',
          round: 2,
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          time: '2:30 PM EST',
          duration: '45 minutes',
          format: 'In-Person',
          location: {
            venue: 'Casting Studios Atlanta',
            address: '1234 Peachtree St NE',
            city: 'Atlanta',
            state: 'GA',
            zip: '30309',
            room: 'Studio B',
            floor: '3rd Floor',
            parking: 'Free parking available',
            publicTransit: 'MARTA Red Line - Arts Center Station'
          }
        },
        castingTeam: {
          castingDirector: {
            name: 'Michael Chen',
            company: 'Chen Casting',
            email: 'casting@chencasting.com',
            phone: '(404) 555-0123'
          }
        },
        requirements: {
          sides: {
            available: true,
            pages: 5,
            downloadUrl: '#',
            scenes: ['INT. POLICE STATION - DAY'],
            dueDate: 'Please prepare all sides'
          },
          wardrobe: 'Business casual',
          preparation: ['Memorize all sides', 'Be ready for cold reads'],
          brings: ['Headshot and resume (3 copies)']
        },
        status: 'confirmed',
        notes: 'Focus on bringing vulnerability to the character.'
      })
    }
  } catch (error) {
    console.error('Error fetching audition:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audition details' },
      { status: 500 }
    )
  }
}