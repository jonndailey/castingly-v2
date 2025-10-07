/**
 * CASTINGLY Archetype System
 * Centralized definitions for the 12 universal character archetypes
 * Based on Carl Jung's archetypal theory and adapted for casting
 */

export interface Archetype {
  id: string
  name: string
  description: string
  traits: string[]
  typicalRoles: string[]
  color: string
  icon: string
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'lover',
    name: 'The Lover',
    description: 'Passionate, devoted, and committed. Seeks connection and intimacy.',
    traits: ['Romantic', 'Passionate', 'Committed', 'Devoted', 'Sensual'],
    typicalRoles: ['Romantic lead', 'Love interest', 'Devoted partner', 'Passionate artist'],
    color: '#E91E63',
    icon: '❤️'
  },
  {
    id: 'hero',
    name: 'The Hero',
    description: 'Brave, determined, and honorable. Rises to challenges and protects others.',
    traits: ['Courageous', 'Determined', 'Honorable', 'Strong', 'Protective'],
    typicalRoles: ['Action hero', 'Protagonist', 'Warrior', 'Protector', 'Leader'],
    color: '#2196F3',
    icon: '⚔️'
  },
  {
    id: 'magician',
    name: 'The Magician',
    description: 'Visionary, inventive, and transformative. Makes dreams come true.',
    traits: ['Visionary', 'Inventive', 'Charismatic', 'Healing', 'Transformative'],
    typicalRoles: ['Mentor', 'Wizard', 'Inventor', 'Shaman', 'Catalyst'],
    color: '#9C27B0',
    icon: '✨'
  },
  {
    id: 'outlaw',
    name: 'The Outlaw',
    description: 'Rebellious, wild, and revolutionary. Breaks rules and disrupts the status quo.',
    traits: ['Rebellious', 'Wild', 'Revolutionary', 'Radical', 'Free'],
    typicalRoles: ['Rebel', 'Anti-hero', 'Revolutionary', 'Misfit', 'Outcast'],
    color: '#F44336',
    icon: '🔥'
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    description: 'Adventurous, curious, and independent. Seeks new experiences and freedom.',
    traits: ['Adventurous', 'Curious', 'Independent', 'Pioneering', 'Wandering'],
    typicalRoles: ['Adventurer', 'Pioneer', 'Seeker', 'Wanderer', 'Individualist'],
    color: '#FF9800',
    icon: '🧭'
  },
  {
    id: 'sage',
    name: 'The Sage',
    description: 'Wise, knowledgeable, and thoughtful. Seeks truth and understanding.',
    traits: ['Wise', 'Knowledgeable', 'Thoughtful', 'Analytical', 'Philosophical'],
    typicalRoles: ['Teacher', 'Expert', 'Scholar', 'Detective', 'Advisor'],
    color: '#607D8B',
    icon: '📚'
  },
  {
    id: 'innocent',
    name: 'The Innocent',
    description: 'Optimistic, pure, and trusting. Seeks happiness and harmony.',
    traits: ['Optimistic', 'Pure', 'Trusting', 'Hopeful', 'Simple'],
    typicalRoles: ['Child', 'Mystic', 'Romantic', 'Dreamer', 'Traditionalist'],
    color: '#03A9F4',
    icon: '🌟'
  },
  {
    id: 'creator',
    name: 'The Creator',
    description: 'Creative, artistic, and imaginative. Desires to create something of value.',
    traits: ['Creative', 'Artistic', 'Imaginative', 'Innovative', 'Visionary'],
    typicalRoles: ['Artist', 'Writer', 'Musician', 'Inventor', 'Entrepreneur'],
    color: '#4CAF50',
    icon: '🎨'
  },
  {
    id: 'ruler',
    name: 'The Ruler',
    description: 'Responsible, authoritative, and organized. Desires control and order.',
    traits: ['Responsible', 'Authoritative', 'Organized', 'Leader', 'Role model'],
    typicalRoles: ['Boss', 'Leader', 'Aristocrat', 'Parent', 'Manager'],
    color: '#795548',
    icon: '👑'
  },
  {
    id: 'caregiver',
    name: 'The Caregiver',
    description: 'Caring, generous, and compassionate. Desires to protect and help others.',
    traits: ['Caring', 'Generous', 'Compassionate', 'Nurturing', 'Selfless'],
    typicalRoles: ['Mother', 'Nurse', 'Teacher', 'Saint', 'Helper'],
    color: '#00BCD4',
    icon: '🤲'
  },
  {
    id: 'everyman',
    name: 'The Everyman',
    description: 'Relatable, down-to-earth, and realistic. Seeks belonging and connection.',
    traits: ['Relatable', 'Realistic', 'Friendly', 'Down-to-earth', 'Empathetic'],
    typicalRoles: ['Regular guy/girl', 'Neighbor', 'Coworker', 'Best friend', 'Citizen'],
    color: '#9E9E9E',
    icon: '👥'
  },
  {
    id: 'jester',
    name: 'The Jester',
    description: 'Fun, humorous, and lighthearted. Lives in the moment and enjoys life.',
    traits: ['Fun', 'Humorous', 'Lighthearted', 'Playful', 'Spontaneous'],
    typicalRoles: ['Comedian', 'Fool', 'Trickster', 'Prankster', 'Entertainer'],
    color: '#FFEB3B',
    icon: '🃏'
  }
]

// Helper functions for working with archetypes
export const getArchetypeById = (id: string): Archetype | undefined => {
  return ARCHETYPES.find(archetype => archetype.id === id)
}

export const getArchetypesByIds = (ids: string[]): Archetype[] => {
  return ids.map(id => getArchetypeById(id)).filter(Boolean) as Archetype[]
}

export const getArchetypeColor = (id: string): string => {
  const archetype = getArchetypeById(id)
  return archetype?.color || '#9C27B0'
}

export const getArchetypeIcon = (id: string): string => {
  const archetype = getArchetypeById(id)
  return archetype?.icon || '🎭'
}