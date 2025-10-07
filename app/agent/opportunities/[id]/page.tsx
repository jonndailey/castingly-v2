'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, Clock, ChevronLeft, Send, UserPlus, FileText, Star } from 'lucide-react';

export default function AgentOpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;
  
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [showActorSelector, setShowActorSelector] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Mock roster data
  const rosterActors = [
    { id: '1', name: 'Emma Thompson', headshot: null, fit: 95 },
    { id: '2', name: 'Michael Chen', headshot: null, fit: 88 },
    { id: '3', name: 'Sarah Williams', headshot: null, fit: 92 },
    { id: '4', name: 'James Rodriguez', headshot: null, fit: 85 },
    { id: '5', name: 'Olivia Davis', headshot: null, fit: 90 }
  ];

  useEffect(() => {
    // Generate mock opportunity data
    const titles = ['Lead Role in Feature Film', 'Supporting Character in TV Series', 'Commercial Campaign', 'Theater Production', 'Netflix Original Series'];
    const numId = parseInt(opportunityId) || 1;
    
    const data = {
      id: opportunityId,
      title: titles[numId % titles.length],
      project: `Project ${numId}`,
      type: ['Feature Film', 'TV Series', 'Commercial', 'Theater'][numId % 4],
      role: 'Lead Character',
      description: 'We are seeking talented actors for key roles in our upcoming production. This is an exciting opportunity to work with an award-winning director and cast. The project offers excellent visibility and career growth potential.',
      requirements: [
        'Age 25-35',
        'Strong dramatic skills',
        'Previous film/TV experience preferred',
        'Must be available for 3-month shoot',
        'Ability to perform emotional scenes'
      ],
      compensation: '$5,000 - $10,000/week',
      location: 'Los Angeles, CA',
      shootDates: 'March 15 - June 20, 2024',
      auditionDate: 'February 10, 2024',
      submissionDeadline: 'February 5, 2024',
      castingDirector: 'Sarah Johnson',
      productionCompany: 'Stellar Productions',
      unionStatus: 'SAG-AFTRA',
      isUrgent: numId % 3 === 0,
      applicants: 150 + numId * 10,
      agencySubmissions: 12,
      clientsSubmitted: ['Emma Thompson', 'Michael Chen']
    };
    
    setOpportunity(data);
    setLoading(false);
  }, [opportunityId]);

  const toggleActorSelection = (actorId: string) => {
    setSelectedActors(prev => 
      prev.includes(actorId) 
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };

  const handleSubmitActors = () => {
    if (selectedActors.length > 0) {
      setSubmitMessage(`Successfully submitted ${selectedActors.length} actor(s) for this role!`);
      setShowActorSelector(false);
      setSelectedActors([]);
      setTimeout(() => setSubmitMessage(''), 3000);
    }
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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/agent/opportunities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Opportunities
        </button>

        {submitMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {submitMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm">
              {/* Header */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{opportunity.title}</h1>
                    <p className="text-lg text-gray-600">{opportunity.project}</p>
                    <div className="flex items-center gap-4 mt-3">
                      {opportunity.isUrgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          Urgent Casting
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {opportunity.type}
                      </span>
                      <span className="text-sm text-gray-500">{opportunity.applicants} total applicants</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Details */}
              <div className="p-6 border-b">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Compensation</p>
                        <p className="font-medium">{opportunity.compensation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{opportunity.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Shoot Dates</p>
                        <p className="font-medium">{opportunity.shootDates}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Submission Deadline</p>
                        <p className="font-medium text-red-600">{opportunity.submissionDeadline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Union Status</p>
                        <p className="font-medium">{opportunity.unionStatus}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Audition Date</p>
                        <p className="font-medium">{opportunity.auditionDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-3">Role Description</h3>
                <p className="text-gray-600 leading-relaxed">{opportunity.description}</p>
              </div>

              {/* Requirements */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {opportunity.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">•</span>
                      <span className="text-gray-600">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Production Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Production Information</h3>
              <div className="space-y-2">
                <p className="text-gray-600">
                  <span className="font-medium">Casting Director:</span> {opportunity.castingDirector}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Production Company:</span> {opportunity.productionCompany}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agency Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Agency Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Agency Submissions</span>
                  <span className="font-medium">{opportunity.agencySubmissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your Submissions</span>
                  <span className="font-medium">{opportunity.clientsSubmitted.length}</span>
                </div>
                {opportunity.clientsSubmitted.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-2">Clients Submitted:</p>
                    <div className="space-y-1">
                      {opportunity.clientsSubmitted.map((client: string, index: number) => (
                        <div key={index} className="text-sm text-gray-900">• {client}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Talent Button */}
            <button
              onClick={() => setShowActorSelector(!showActorSelector)}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Submit Talent
            </button>

            {/* Actor Selector */}
            {showActorSelector && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Select Actors to Submit</h3>
                <div className="space-y-3 mb-4">
                  {rosterActors.map(actor => (
                    <label
                      key={actor.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedActors.includes(actor.id)}
                        onChange={() => toggleActorSelection(actor.id)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{actor.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">{actor.fit}% fit</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitActors}
                    disabled={selectedActors.length === 0}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Submit ({selectedActors.length})
                  </button>
                  <button
                    onClick={() => {
                      setShowActorSelector(false);
                      setSelectedActors([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Download Brief
                </button>
                <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Share with Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}