'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Award, FileText, Edit, Send, Download, Briefcase, Star, Clock, TrendingUp, DollarSign } from 'lucide-react';

export default function AgentRosterActorPage() {
  const params = useParams();
  const router = useRouter();
  const actorId = params.actorId as string;
  
  const [actor, setActor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Generate mock actor data based on ID
    const names = ['Emma Thompson', 'Michael Chen', 'Sarah Williams', 'James Rodriguez', 'Olivia Davis'];
    const numId = parseInt(actorId.replace('actor', '')) || 1;
    
    const data = {
      id: actorId,
      name: names[numId % names.length],
      email: `${names[numId % names.length].toLowerCase().replace(' ', '.')}@email.com`,
      phone: '(555) 123-4567',
      location: 'Los Angeles, CA',
      age: 25 + (numId % 15),
      height: "5'8\"",
      weight: '140 lbs',
      hairColor: 'Brown',
      eyeColor: 'Blue',
      ethnicity: 'Caucasian',
      unionStatus: 'SAG-AFTRA',
      languages: ['English', 'Spanish'],
      specialSkills: ['Stage Combat', 'Horseback Riding', 'Singing', 'Dancing'],
      representation: {
        agent: 'You',
        manager: 'Jane Smith',
        publicist: 'PR Agency Inc.'
      },
      bio: 'Award-winning actor with extensive experience in film, television, and theater. Known for versatile performances and strong character work. Recently starred in several high-profile productions and continues to build an impressive portfolio.',
      stats: {
        totalBookings: 12 + numId,
        auditionsThisMonth: 8,
        callbackRate: '65%',
        bookingRate: '22%',
        avgDayRate: '$2,500',
        totalEarningsThisYear: '$125,000'
      },
      recentProjects: [
        { title: 'Downtown Medical', type: 'TV Series', role: 'Lead', status: 'Filming' },
        { title: 'Summer Dreams', type: 'Feature Film', role: 'Supporting', status: 'Post-Production' },
        { title: 'Tech Giant Commercial', type: 'Commercial', role: 'Principal', status: 'Completed' }
      ],
      upcomingAuditions: [
        { project: 'Netflix Series', date: 'Feb 15, 2024', time: '2:00 PM', location: 'Studio City' },
        { project: 'Feature Film', date: 'Feb 18, 2024', time: '10:00 AM', location: 'Hollywood' }
      ],
      activeSubmissions: [
        { project: 'Action Feature', submitted: 'Feb 1, 2024', status: 'Under Review' },
        { project: 'Drama Series', submitted: 'Jan 28, 2024', status: 'Callback Scheduled' },
        { project: 'Commercial', submitted: 'Jan 25, 2024', status: 'Pending' }
      ],
      documents: [
        { name: 'Resume', updated: 'Jan 15, 2024' },
        { name: 'Headshots', updated: 'Dec 10, 2023' },
        { name: 'Demo Reel', updated: 'Nov 20, 2023' }
      ],
      notes: [
        { date: 'Feb 5, 2024', note: 'Client booked for Tech Giant commercial shoot next week.' },
        { date: 'Feb 1, 2024', note: 'Callback for Netflix series went very well.' },
        { date: 'Jan 28, 2024', note: 'Updated headshots received and uploaded to casting platforms.' }
      ]
    };
    
    setActor(data);
    setLoading(false);
  }, [actorId]);

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
          onClick={() => router.push('/agent/roster')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roster
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{actor.name}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {actor.location}
                    </span>
                    <span>Age {actor.age}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {actor.unionStatus}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit to Casting
                  </button>
                </div>
              </div>
              <div className="mt-4 flex gap-6">
                <a href={`mailto:${actor.email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                  <Mail className="w-4 h-4" />
                  {actor.email}
                </a>
                <a href={`tel:${actor.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                  <Phone className="w-4 h-4" />
                  {actor.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">Bookings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Auditions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.auditionsThisMonth}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Callback Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.callbackRate}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Booking Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.bookingRate}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Day Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.avgDayRate}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">YTD Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{actor.stats.totalEarningsThisYear}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b">
            <div className="flex gap-6 px-6">
              {['overview', 'projects', 'submissions', 'documents', 'notes'].map((tab) => (
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
                    <p className="text-gray-600 leading-relaxed">{actor.bio}</p>
                  </div>

                  {/* Physical Attributes */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Physical Attributes</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Height:</span>
                        <p className="font-medium">{actor.height}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Weight:</span>
                        <p className="font-medium">{actor.weight}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Hair Color:</span>
                        <p className="font-medium">{actor.hairColor}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Eye Color:</span>
                        <p className="font-medium">{actor.eyeColor}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Ethnicity:</span>
                        <p className="font-medium">{actor.ethnicity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Skills */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Special Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {actor.specialSkills.map((skill: string, index: number) => (
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
                      {actor.languages.map((language: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Upcoming Auditions */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Upcoming Auditions</h3>
                    <div className="space-y-3">
                      {actor.upcomingAuditions.map((audition: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900">{audition.project}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Calendar className="w-3 h-3" />
                            {audition.date}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {audition.time}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3 h-3" />
                            {audition.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Representation */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Representation</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Agent:</span>
                        <p className="font-medium">{actor.representation.agent}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Manager:</span>
                        <p className="font-medium">{actor.representation.manager}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Publicist:</span>
                        <p className="font-medium">{actor.representation.publicist}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {actor.recentProjects.map((project: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{project.title}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>{project.type}</span>
                          <span>•</span>
                          <span>{project.role}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'Filming' ? 'bg-green-100 text-green-800' :
                        project.status === 'Post-Production' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Active Submissions</h3>
                <div className="space-y-3">
                  {actor.activeSubmissions.map((submission: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{submission.project}</p>
                        <p className="text-sm text-gray-600 mt-1">Submitted: {submission.submitted}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'Callback Scheduled' ? 'bg-green-100 text-green-800' :
                        submission.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                  {actor.documents.map((doc: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                      <FileText className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-600">Updated: {doc.updated}</p>
                      <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Notes & Activity</h3>
                <div className="space-y-3">
                  {actor.notes.map((note: any, index: number) => (
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