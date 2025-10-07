'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Calendar, Mail, Phone, Download, ChevronLeft, Send, Video, Bookmark, BookmarkCheck } from 'lucide-react';

// Mock data generator for any actor ID
const generateActorData = (id: string) => {
  const names = [
    { first: 'Alex', last: 'Johnson' },
    { first: 'Jordan', last: 'Smith' },
    { first: 'Taylor', last: 'Brown' },
    { first: 'Casey', last: 'Davis' },
    { first: 'Morgan', last: 'Wilson' }
  ];
  
  const numId = parseInt(id.replace(/\D/g, '')) || 1;
  const randomName = names[numId % names.length];
  const age = 20 + (numId % 30);
  
  return {
    id: id,
    name: `${randomName.first} ${randomName.last}`,
    age: age,
    location: 'Los Angeles, CA',
    unionStatus: numId % 2 === 0 ? 'SAG-AFTRA' : 'Non-Union',
    headshot: `https://i.pravatar.cc/400?img=${numId % 70}`,
    height: `${5 + (numId % 2)}'${4 + (numId % 8)}"`,
    weight: `${120 + (numId % 60)} lbs`,
    hairColor: ['Blonde', 'Brown', 'Black', 'Red'][numId % 4],
    eyeColor: ['Blue', 'Brown', 'Green', 'Hazel'][numId % 4],
    experience: `${3 + (numId % 12)} years`,
    skills: ['Drama', 'Comedy', 'Action', 'Improv', 'Voice Acting'],
    bio: `${randomName.first} is a talented actor with extensive experience in film, television, and theater. Known for versatility and strong emotional range.`,
    email: `${randomName.first.toLowerCase()}.${randomName.last.toLowerCase()}@email.com`,
    phone: `(310) 555-${String(1000 + numId).padStart(4, '0')}`,
    agentName: 'Creative Talent Agency',
    agentPhone: '(310) 555-0001',
    headshots: [
      `https://i.pravatar.cc/400?img=${numId % 70}`,
      `https://i.pravatar.cc/400?img=${(numId + 1) % 70}`,
      `https://i.pravatar.cc/400?img=${(numId + 2) % 70}`
    ],
    demoReels: [
      { title: 'Drama Reel 2024', url: 'https://vimeo.com/demo' },
      { title: 'Comedy Reel 2024', url: 'https://youtube.com/demo' }
    ],
    previousWork: [
      { title: 'Breaking Boundaries', role: 'Lead', type: 'Film', year: '2023' },
      { title: 'City Streets', role: 'Supporting', type: 'TV Series', year: '2023' },
      { title: 'The Last Hour', role: 'Guest Star', type: 'TV Series', year: '2022' }
    ],
    availability: 'Available immediately',
    rating: 4
  };
};

export default function TalentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const actorId = params.actorId as string;
  
  const [actor, setActor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [rating, setRating] = useState(0);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [notes, setNotes] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const data = generateActorData(actorId);
      setActor(data);
      setRating(data.rating);
      setLoading(false);
    }, 500);
  }, [actorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading talent profile...</p>
        </div>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Talent not found</h2>
          <button
            onClick={() => router.push('/casting/talent')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Talent Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <button
            onClick={() => router.push('/casting/talent')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Talent Search
          </button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Headshot */}
            <div className="flex-shrink-0">
              <img
                src={actor.headshot}
                alt={actor.name}
                className="w-48 h-64 object-cover rounded-lg shadow-lg"
              />
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {actor.unionStatus}
                </span>
                {isShortlisted && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Shortlisted
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{actor.name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <span>{actor.age} years old</span>
                <span>•</span>
                <span>{actor.location}</span>
                <span>•</span>
                <span>{actor.experience} experience</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm text-gray-600">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          rating >= star
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsShortlisted(!isShortlisted)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isShortlisted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isShortlisted ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      Shortlisted
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Add to Shortlist
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Audition
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Video className="w-4 h-4" />
                  Request Self-Tape
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Mail className="w-4 h-4" />
                  Contact Agent
                </button>
              </div>

              {/* Agent Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Representation</h3>
                <p className="text-sm text-gray-600">{actor.agentName}</p>
                <p className="text-sm text-gray-600">{actor.agentPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {['overview', 'media', 'experience', 'availability', 'notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Physical Attributes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-medium">{actor.height}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{actor.weight}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Hair Color:</span>
                      <span className="font-medium">{actor.hairColor}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Eye Color:</span>
                      <span className="font-medium">{actor.eyeColor}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Professional Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Union Status:</span>
                      <span className="font-medium">{actor.unionStatus}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{actor.experience}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{actor.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{actor.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Biography</h3>
                  <p className="text-gray-600">{actor.bio}</p>
                </div>

                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Special Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {actor.skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Headshots</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {actor.headshots.map((photo: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Headshot ${index + 1}`}
                          className="w-full aspect-[3/4] object-cover rounded-lg"
                        />
                        <button className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Download className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Demo Reels</h3>
                  <div className="space-y-3">
                    {actor.demoReels.map((reel: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Video className="w-5 h-5 text-primary-600" />
                          <div>
                            <h4 className="font-medium">{reel.title}</h4>
                            <p className="text-sm text-gray-600">Click to watch</p>
                          </div>
                        </div>
                        <a
                          href={reel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Watch →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Previous Work</h3>
                <div className="space-y-3">
                  {actor.previousWork.map((work: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{work.title}</h4>
                        <p className="text-sm text-gray-600">{work.role}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {work.type}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{work.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'availability' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Current Availability</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">{actor.availability}</p>
                  <p className="text-green-700 text-sm mt-2">
                    This actor is available for immediate booking and auditions.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Casting Notes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Private notes about this talent for your casting consideration.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-40 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add your casting notes here..."
                />
                <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Save Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Schedule Audition</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
                  placeholder="Audition instructions, location, etc."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Audition scheduled for ${actor.name}`);
                  setShowScheduleModal(false);
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}