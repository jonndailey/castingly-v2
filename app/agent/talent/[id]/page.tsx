'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Award, FileText, Edit, Send, Download, Briefcase, Star, Clock, TrendingUp, DollarSign, Heart, Share2, MoreVertical } from 'lucide-react';

export default function AgentTalentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const talentId = params.id as string;
  
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInRoster, setIsInRoster] = useState(false);
  const baseTabs = ['overview', 'credits', 'media', 'training'] as const;
  const tabList = isInRoster ? [...baseTabs, 'notes'] : [...baseTabs];

  useEffect(() => {
    // Generate mock talent data based on ID
    const names = ['Sophia Martinez', 'David Kim', 'Jessica Brown', 'Ryan Thompson', 'Maria Garcia'];
    const numId = parseInt(talentId) || 1;
    const inRoster = numId % 3 !== 0; // Some are in roster, some aren't
    
    const data = {
      id: talentId,
      name: names[numId % names.length],
      email: `${names[numId % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      phone: '(555) 987-6543',
      location: 'New York, NY',
      age: 22 + (numId % 18),
      height: "5'6\"",
      weight: '130 lbs',
      hairColor: 'Black',
      eyeColor: 'Brown',
      ethnicity: 'Latino/Hispanic',
      unionStatus: numId % 2 === 0 ? 'SAG-AFTRA' : 'Non-Union',
      languages: ['English', 'Spanish', 'French'],
      specialSkills: ['Martial Arts', 'Singing', 'Dance (Ballet)', 'Accents', 'Swimming'],
      bio: 'Versatile performer with extensive training in classical theater and contemporary film. Graduate of NYU Tisch School of the Arts with a BFA in Drama. Known for transformative character work and strong emotional range. Recent work includes lead roles in several independent films and recurring appearances on network television.',
      training: [
        'NYU Tisch School of the Arts - BFA Drama',
        'Stella Adler Studio of Acting',
        'Upright Citizens Brigade - Improv Training',
        'Shakespeare & Company - Classical Training'
      ],
      credits: {
        film: [
          { title: 'The Last Summer', role: 'Lead', year: '2024' },
          { title: 'Midnight in Brooklyn', role: 'Supporting', year: '2023' },
          { title: 'Finding Home', role: 'Lead', year: '2023' }
        ],
        tv: [
          { title: 'City Stories', role: 'Recurring', year: '2024' },
          { title: 'Medical Mystery', role: 'Guest Star', year: '2023' },
          { title: 'Crime Scene NY', role: 'Co-Star', year: '2023' }
        ],
        theater: [
          { title: 'Hamlet', role: 'Ophelia', venue: 'Public Theater', year: '2023' },
          { title: 'A Streetcar Named Desire', role: 'Stella', venue: 'Off-Broadway', year: '2022' }
        ]
      },
      media: {
        headshots: 4,
        demoReel: 'https://vimeo.com/example',
        resume: 'Available',
        lastUpdated: 'Jan 28, 2024'
      },
      stats: {
        viewsThisMonth: 87,
        submissions: 15,
        callbacks: 6,
        bookings: 2
      },
      representation: {
        agent: inRoster ? 'You' : 'Creative Artists Agency',
        manager: 'StarMakers Management',
        publicist: null
      },
      notes: inRoster ? [
        { date: 'Feb 3, 2024', note: 'Great callback for Netflix series. Director loved her read.' },
        { date: 'Jan 25, 2024', note: 'Updated headshots received. Much stronger commercial look.' }
      ] : []
    };
    
    setTalent(data);
    setIsInRoster(inRoster);
    setLoading(false);
  }, [talentId]);

  const handleAddToRoster = () => {
    setIsInRoster(true);
    alert('Talent added to your roster!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-40 h-40 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{talent.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {talent.location}
                    </span>
                    <span>Age {talent.age}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {talent.unionStatus}
                    </span>
                    {isInRoster && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        In Your Roster
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-6">
                    <a href={`mailto:${talent.email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                      <Mail className="w-4 h-4" />
                      {talent.email}
                    </a>
                    <a href={`tel:${talent.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                      <Phone className="w-4 h-4" />
                      {talent.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isInRoster && (
                    <button 
                      onClick={handleAddToRoster}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      Add to Roster
                    </button>
                  )}
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit to Casting
                  </button>
                  <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Profile Views</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{talent.stats.viewsThisMonth}</p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Send className="w-4 h-4" />
              <span className="text-sm">Submissions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{talent.stats.submissions}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Callbacks</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{talent.stats.callbacks}</p>
            <p className="text-xs text-gray-500">40% rate</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-sm">Bookings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{talent.stats.bookings}</p>
            <p className="text-xs text-gray-500">Recent</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b">
            <div className="flex gap-6 px-6">
              {tabList.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 font-medium capitalize ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  {/* Bio */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Biography</h3>
                    <p className="text-gray-600 leading-relaxed">{talent.bio}</p>
                  </div>

                  {/* Physical Attributes */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Physical Attributes</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Height:</span>
                        <p className="font-medium">{talent.height}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Weight:</span>
                        <p className="font-medium">{talent.weight}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Hair Color:</span>
                        <p className="font-medium">{talent.hairColor}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Eye Color:</span>
                        <p className="font-medium">{talent.eyeColor}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ethnicity:</span>
                        <p className="font-medium">{talent.ethnicity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Skills */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Special Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {talent.specialSkills.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                    <div className="flex gap-2">
                      {talent.languages.map((language: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Representation */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Representation</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Agent:</span>
                        <p className="font-medium">{talent.representation.agent}</p>
                      </div>
                      {talent.representation.manager && (
                        <div>
                          <span className="text-sm text-gray-600">Manager:</span>
                          <p className="font-medium">{talent.representation.manager}</p>
                        </div>
                      )}
                      {talent.representation.publicist && (
                        <div>
                          <span className="text-sm text-gray-600">Publicist:</span>
                          <p className="font-medium">{talent.representation.publicist}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 border">
                        <FileText className="w-4 h-4" />
                        Download Resume
                      </button>
                      <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 border">
                        <Download className="w-4 h-4" />
                        Download Headshots
                      </button>
                      <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 border">
                        <Mail className="w-4 h-4" />
                        Contact Talent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'credits' && (
              <div className="space-y-6">
                {/* Film */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Film</h3>
                  <div className="space-y-2">
                    {talent.credits.film.map((credit: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{credit.title}</p>
                          <p className="text-sm text-gray-600">{credit.role}</p>
                        </div>
                        <span className="text-sm text-gray-500">{credit.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TV */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Television</h3>
                  <div className="space-y-2">
                    {talent.credits.tv.map((credit: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{credit.title}</p>
                          <p className="text-sm text-gray-600">{credit.role}</p>
                        </div>
                        <span className="text-sm text-gray-500">{credit.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theater */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Theater</h3>
                  <div className="space-y-2">
                    {talent.credits.theater.map((credit: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{credit.title}</p>
                          <p className="text-sm text-gray-600">{credit.role} - {credit.venue}</p>
                        </div>
                        <span className="text-sm text-gray-500">{credit.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Headshots</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Demo Reel</h3>
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <button className="p-4 bg-white/20 rounded-full hover:bg-white/30">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Last updated: {talent.media.lastUpdated}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'training' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Training & Education</h3>
                <div className="space-y-3">
                  {talent.training.map((item: string, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && isInRoster && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Notes & Activity</h3>
                <div className="space-y-3">
                  {talent.notes.map((note: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">{note.date}</p>
                      <p className="text-gray-900">{note.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <textarea
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={3}
                  />
                  <button className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                    Add Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
