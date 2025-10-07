'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Users, Clock, ChevronLeft, Send, Heart } from 'lucide-react';

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;
  
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

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
      description: 'We are seeking a talented actor for a lead role in our upcoming production. This is an exciting opportunity to work with an award-winning director and cast.',
      requirements: [
        'Age 25-35',
        'Strong dramatic skills',
        'Previous film/TV experience preferred',
        'Must be available for 3-month shoot'
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
      applicants: 150 + numId * 10
    };
    
    setOpportunity(data);
    setLoading(false);
  }, [opportunityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/actor/opportunities')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Opportunities
        </button>

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
                  <span className="text-sm text-gray-500">{opportunity.applicants} applicants</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-2 rounded-lg border ${saved ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-300'}`}
                >
                  <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                </button>
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
          <div className="p-6 border-b">
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

          {/* Production Info */}
          <div className="p-6 border-b">
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

          {/* Action */}
          <div className="p-6">
            <button
              onClick={() => {
                setApplied(true);
                alert('Application submitted successfully!');
              }}
              disabled={applied}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                applied 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {applied ? (
                <>Application Submitted</>
              ) : (
                <>
                  <Send className="w-4 h-4 inline mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}