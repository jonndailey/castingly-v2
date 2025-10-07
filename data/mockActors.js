// Mock actor data for development
export const mockActors = {
  'actor1': {
    id: 'actor1',
    name: 'Emma Thompson',
    age: 28,
    location: 'Los Angeles, CA',
    unionStatus: 'SAG-AFTRA',
    headshot: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    height: "5'7\"",
    weight: '130 lbs',
    hairColor: 'Blonde',
    eyeColor: 'Blue',
    experience: '8 years',
    skills: ['Comedy', 'Drama', 'Improv', 'Stage Combat', 'British Accent'],
    bio: 'Emma is a versatile actress with extensive theater and film experience. She has performed in over 20 productions ranging from Shakespeare to contemporary works. Known for her strong emotional range and comedic timing.',
    agentNotes: 'Very professional and reliable. Great for romantic comedies and period pieces. Has strong callback rate.',
    email: 'emma.thompson@email.com',
    phone: '(310) 555-0123',
    website: 'www.emmathompsonactor.com',
    representation: {
      agent: 'Sarah Martinez',
      agency: 'Stellar Talent Agency',
      manager: 'David Chen'
    },
    headshots: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ],
    demoReels: [
      { title: 'Drama Reel 2024', url: 'https://vimeo.com/demo1' },
      { title: 'Comedy Reel 2024', url: 'https://vimeo.com/demo2' }
    ],
    resume: '/resumes/emma-thompson.pdf',
    training: [
      'MFA Acting - Yale School of Drama',
      'BA Theater - UCLA',
      'Groundlings Improv Program',
      'Stella Adler Technique Workshop'
    ],
    specialSkills: [
      'Horseback Riding',
      'Basic Guitar',
      'Swimming',
      'Valid Driver\'s License',
      'US/UK Passport'
    ],
    recentActivity: [
      { date: '2024-01-15', type: 'booking', project: 'Netflix Series - Supporting Role' },
      { date: '2024-01-10', type: 'callback', project: 'HBO Pilot' },
      { date: '2024-01-08', type: 'submission', project: 'Feature Film - Lead' },
      { date: '2024-01-05', type: 'audition', project: 'Commercial - National' }
    ]
  },
  'actor2': {
    id: 'actor2',
    name: 'Michael Rodriguez',
    age: 32,
    location: 'New York, NY',
    unionStatus: 'SAG-AFTRA / AEA',
    headshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    height: "6'1\"",
    weight: '185 lbs',
    hairColor: 'Dark Brown',
    eyeColor: 'Brown',
    experience: '12 years',
    skills: ['Drama', 'Action', 'Stage Combat', 'Spanish (Native)', 'Guitar', 'Dance'],
    bio: 'Michael is an accomplished actor with a strong background in both theater and film. Broadway credits include Hamilton and West Side Story. Recently wrapped a recurring role on Law & Order: SVU. Fluent in Spanish and English, with advanced stage combat certification.',
    agentNotes: 'Excellent for action roles and dramatic leads. Very athletic and does his own stunts. Strong presence on camera. Available for travel.',
    email: 'michael.rodriguez@email.com',
    phone: '(212) 555-0456',
    website: 'www.michaelrodriguezactor.com',
    instagram: '@mrodriguezactor',
    representation: {
      agent: 'Jennifer Walsh',
      agency: 'Creative Artists Management',
      manager: 'Robert Kim'
    },
    headshots: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400'
    ],
    demoReels: [
      { title: 'Action Reel 2024', url: 'https://vimeo.com/demo3' },
      { title: 'Drama Reel 2024', url: 'https://vimeo.com/demo4' },
      { title: 'Theater Highlights', url: 'https://youtube.com/demo5' }
    ],
    resume: '/resumes/michael-rodriguez.pdf',
    training: [
      'BFA Acting - Juilliard',
      'Shakespeare & Company',
      'Upright Citizens Brigade',
      'The Barrow Group',
      'Fight Directors Canada - Advanced Certification'
    ],
    specialSkills: [
      'Stage Combat (Certified)',
      'Guitar (Advanced)',
      'Spanish (Native)',
      'Portuguese (Conversational)',
      'Boxing',
      'Motorcycle License',
      'SCUBA Certified'
    ],
    credits: {
      film: [
        { title: 'The Last Stand', role: 'Carlos', year: '2023', type: 'Supporting' },
        { title: 'City Lights', role: 'Detective Rivera', year: '2022', type: 'Lead' }
      ],
      television: [
        { title: 'Law & Order: SVU', role: 'ADA Martinez', year: '2023', type: 'Recurring' },
        { title: 'Blue Bloods', role: 'Officer Sanchez', year: '2022', type: 'Guest Star' }
      ],
      theater: [
        { title: 'Hamilton', role: 'Alexander Hamilton', year: '2023', venue: 'Broadway' },
        { title: 'West Side Story', role: 'Bernardo', year: '2022', venue: 'Broadway' }
      ]
    },
    recentActivity: [
      { date: '2024-01-18', type: 'booking', project: 'Apple TV+ Series - Series Regular' },
      { date: '2024-01-16', type: 'callback', project: 'Marvel Studios - Supporting Role' },
      { date: '2024-01-14', type: 'audition', project: 'Broadway Revival - Lead' },
      { date: '2024-01-12', type: 'submission', project: 'Netflix Feature' },
      { date: '2024-01-10', type: 'meeting', project: 'Director Meeting - A24 Film' }
    ],
    availability: {
      status: 'Available with notice',
      conflicts: ['Feb 15-20: Personal travel', 'March 1-5: Commercial shoot'],
      willingToTravel: true,
      passport: true,
      localHire: ['NYC', 'LA', 'Atlanta']
    }
  },
  'actor3': {
    id: 'actor3',
    name: 'Sophie Chen',
    age: 25,
    location: 'Vancouver, BC',
    unionStatus: 'ACTRA',
    headshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    height: "5'5\"",
    weight: '120 lbs',
    hairColor: 'Black',
    eyeColor: 'Brown',
    experience: '5 years',
    skills: ['Drama', 'Comedy', 'Martial Arts', 'Mandarin (Native)', 'Violin'],
    bio: 'Sophie is a rising talent with a background in martial arts and classical music. Recent graduate from Vancouver Film School. Specializes in action and dramatic roles.',
    agentNotes: 'Up-and-coming talent. Great for younger roles. Very dedicated and hardworking.',
    email: 'sophie.chen@email.com',
    phone: '(604) 555-0789',
    representation: {
      agent: 'Lisa Park',
      agency: 'North Star Talent'
    },
    headshots: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
    ],
    demoReels: [
      { title: 'Acting Reel 2024', url: 'https://vimeo.com/demo6' }
    ],
    recentActivity: [
      { date: '2024-01-17', type: 'audition', project: 'CW Series - Recurring' },
      { date: '2024-01-15', type: 'submission', project: 'Indie Feature - Lead' }
    ]
  }
};