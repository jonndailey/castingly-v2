export interface Archetype {
  id: string
  name: string
  tagline: string
  description: string
  traits: string[]
  examples?: string[]
}

export const archetypes: Archetype[] = [
  {
    id: 'hero',
    name: 'Hero',
    tagline: 'The Courageous Leader',
    description: 'Brave, determined, and driven to overcome challenges. Heroes embody courage and sacrifice for the greater good.',
    traits: ['Courageous', 'Determined', 'Self-sacrificing', 'Inspiring', 'Protective'],
    examples: ['Wonder Woman', 'Luke Skywalker', 'Katniss Everdeen']
  },
  {
    id: 'innocent',
    name: 'Innocent',
    tagline: 'The Pure Spirit',
    description: 'Pure-hearted, optimistic, and full of wonder. Innocents see the good in everyone and maintain faith despite adversity.',
    traits: ['Optimistic', 'Trusting', 'Pure', 'Hopeful', 'Naive'],
    examples: ['Dorothy (Wizard of Oz)', 'Forrest Gump', 'Wall-E']
  },
  {
    id: 'explorer',
    name: 'Explorer',
    tagline: 'The Adventurous Soul',
    description: 'Adventurous, curious, and drawn to new experiences. Explorers seek freedom and discovery above all else.',
    traits: ['Adventurous', 'Independent', 'Curious', 'Restless', 'Bold'],
    examples: ['Indiana Jones', 'Moana', 'Captain Kirk']
  },
  {
    id: 'sage',
    name: 'Sage',
    tagline: 'The Wise Teacher',
    description: 'Wise, thoughtful, and a seeker of truth and understanding. Sages value knowledge and share wisdom with others.',
    traits: ['Wise', 'Knowledgeable', 'Thoughtful', 'Analytical', 'Mentoring'],
    examples: ['Gandalf', 'Yoda', 'Hermione Granger']
  },
  {
    id: 'rebel',
    name: 'Rebel',
    tagline: 'The Revolutionary',
    description: 'Bold, unconventional, and unafraid to challenge authority. Rebels break rules to create change.',
    traits: ['Revolutionary', 'Unconventional', 'Defiant', 'Independent', 'Disruptive'],
    examples: ['The Joker', 'Tyler Durden', 'Lisbeth Salander']
  },
  {
    id: 'lover',
    name: 'Lover',
    tagline: 'The Romantic',
    description: 'Passionate, expressive, and guided by emotion and connection. Lovers seek intimacy and experience.',
    traits: ['Passionate', 'Devoted', 'Emotional', 'Sensual', 'Committed'],
    examples: ['Romeo & Juliet', 'Jack & Rose (Titanic)', 'Noah & Allie (The Notebook)']
  },
  {
    id: 'creator',
    name: 'Creator',
    tagline: 'The Visionary',
    description: 'Visionary, imaginative, and driven to build or express. Creators bring new things into being.',
    traits: ['Creative', 'Imaginative', 'Artistic', 'Innovative', 'Perfectionist'],
    examples: ['Tony Stark', 'Willy Wonka', 'Dr. Frankenstein']
  },
  {
    id: 'jester',
    name: 'Jester',
    tagline: 'The Entertainer',
    description: 'Playful, witty, and able to bring levity and truth through humor. Jesters live in the moment.',
    traits: ['Funny', 'Playful', 'Spontaneous', 'Irreverent', 'Lighthearted'],
    examples: ['Deadpool', 'The Genie (Aladdin)', 'Jack Sparrow']
  },
  {
    id: 'caregiver',
    name: 'Caregiver',
    tagline: 'The Nurturer',
    description: 'Compassionate, nurturing, and selfless in service to others. Caregivers protect and care for those in need.',
    traits: ['Caring', 'Selfless', 'Protective', 'Nurturing', 'Generous'],
    examples: ['Mary Poppins', 'Samwise Gamgee', 'Mrs. Weasley']
  },
  {
    id: 'ruler',
    name: 'Ruler',
    tagline: 'The Leader',
    description: 'Confident, commanding, and natural at leading or taking charge. Rulers create order and prosperity.',
    traits: ['Authoritative', 'Responsible', 'Organized', 'Commanding', 'Decisive'],
    examples: ['Nick Fury', 'Miranda Priestly', 'King T\'Challa']
  },
  {
    id: 'magician',
    name: 'Magician',
    tagline: 'The Transformer',
    description: 'Charismatic, insightful, and able to transform situations or people. Magicians make dreams come true.',
    traits: ['Charismatic', 'Transformative', 'Healing', 'Visionary', 'Influential'],
    examples: ['Dumbledore', 'The Oracle (Matrix)', 'Doctor Strange']
  },
  {
    id: 'regular',
    name: 'Regular Guy/Girl',
    tagline: 'The Everyperson',
    description: 'Relatable, grounded, and authentically human. Regular people are down-to-earth and genuine.',
    traits: ['Relatable', 'Humble', 'Authentic', 'Hardworking', 'Realistic'],
    examples: ['Jim Halpert', 'Bridget Jones', 'Peter Parker (early)']
  }
]

export const getArchetype = (id: string): Archetype | undefined => {
  return archetypes.find(a => a.id === id)
}

export const getArchetypesByIds = (ids: string[]): Archetype[] => {
  return ids.map(id => getArchetype(id)).filter(Boolean) as Archetype[]
}