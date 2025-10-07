'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, Calendar, Users, Clock, MapPin, Film, 
  Edit, Trash2, Plus, Send, Download, Eye, Check, X,
  Star, UserPlus, Mail, Phone, FileText
} from 'lucide-react';

// Mock project data generator
const generateProjectData = (id: string) => {
  const titles = [
    'Summer Romance', 'The Last Detective', 'City Lights', 
    'Breaking Boundaries', 'Midnight Express', 'The Journey Home'
  ];
  
  const numId = parseInt(id) || 1;
  const title = titles[numId % titles.length];
  
  return {
    id: id,
    title: title,
    type: numId % 2 === 0 ? 'Feature Film' : 'TV Series',
    status: ['Pre-Production', 'Casting', 'In Production', 'Post-Production'][numId % 4],
    genre: ['Drama', 'Comedy', 'Action', 'Thriller'][numId % 4],
    synopsis: `A compelling ${['drama', 'comedy', 'action', 'thriller'][numId % 4]} that explores themes of love, loss, and redemption. This project promises to be a groundbreaking piece that will resonate with audiences worldwide.`,
    director: ['Steven Anderson', 'Maria Garcia', 'James Chen', 'Sarah Williams'][numId % 4],
    producer: 'Stellar Productions',
    castingDirector: 'Jennifer Walsh',
    shootingStart: '2024-03-15',
    shootingEnd: '2024-05-20',
    location: ['Los Angeles, CA', 'New York, NY', 'Atlanta, GA', 'Vancouver, BC'][numId % 4],
    budget: ['$5M - $10M', '$10M - $25M', '$25M - $50M', '$50M+'][numId % 4],
    union: numId % 2 === 0 ? 'SAG-AFTRA' : 'Non-Union',
    roles: [
      {
        id: 1,
        name: 'Lead Character',
        description: 'Strong dramatic lead with emotional range',
        gender: 'Any',
        ageRange: '25-35',
        ethnicity: 'Open',
        status: 'Open',
        submissions: 45,
        callbacks: 5,
        shortlisted: 3
      },
      {
        id: 2,
        name: 'Supporting Role',
        description: 'Comedic relief character with great timing',
        gender: 'Female',
        ageRange: '30-40',
        ethnicity: 'Open',
        status: 'Callbacks',
        submissions: 32,
        callbacks: 8,
        shortlisted: 4
      },
      {
        id: 3,
        name: 'Antagonist',
        description: 'Complex villain with depth',
        gender: 'Male',
        ageRange: '40-50',
        ethnicity: 'Open',
        status: 'Open',
        submissions: 28,
        callbacks: 3,
        shortlisted: 2
      }
    ],
    auditions: [
      {
        id: 1,
        actorName: 'Emma Thompson',
        role: 'Lead Character',
        date: '2024-02-10',
        time: '10:00 AM',
        status: 'Scheduled',
        notes: 'Strong first impression, callback recommended'
      },
      {
        id: 2,
        actorName: 'Michael Rodriguez',
        role: 'Antagonist',
        date: '2024-02-10',
        time: '11:00 AM',
        status: 'Scheduled',
        notes: 'Great intensity, perfect for the role'
      },
      {
        id: 3,
        actorName: 'Sarah Johnson',
        role: 'Supporting Role',
        date: '2024-02-11',
        time: '2:00 PM',
        status: 'Scheduled',
        notes: 'Excellent comedic timing'
      }
    ],
    timeline: [
      { date: '2024-01-15', event: 'Project Announced', completed: true },
      { date: '2024-02-01', event: 'Casting Begins', completed: true },
      { date: '2024-02-15', event: 'Callbacks', completed: false },
      { date: '2024-03-01', event: 'Final Casting', completed: false },
      { date: '2024-03-15', event: 'Production Starts', completed: false }
    ]
  };
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [showScheduleAudition, setShowScheduleAudition] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const data = generateProjectData(projectId);
      setProject(data);
      setLoading(false);
    }, 500);
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <button
            onClick={() => router.push('/casting/projects')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Pre-Production': 'bg-gray-100 text-gray-800',
      'Casting': 'bg-blue-100 text-blue-800',
      'In Production': 'bg-green-100 text-green-800',
      'Post-Production': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleStatusColor = (status: string) => {
    const colors: any = {
      'Open': 'bg-green-100 text-green-800',
      'Callbacks': 'bg-yellow-100 text-yellow-800',
      'Filled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <button
            onClick={() => router.push('/casting/projects')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Projects
          </button>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className="text-gray-600">{project.type}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">{project.genre}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Edit className="w-4 h-4" />
                Edit Project
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Send className="w-4 h-4" />
                Share Project
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {project.roles.reduce((acc: number, role: any) => acc + role.submissions, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {project.roles.length}
              </div>
              <div className="text-sm text-gray-600">Open Roles</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {project.auditions.length}
              </div>
              <div className="text-sm text-gray-600">Scheduled Auditions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {project.roles.reduce((acc: number, role: any) => acc + role.shortlisted, 0)}
              </div>
              <div className="text-sm text-gray-600">Shortlisted</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {['overview', 'roles', 'auditions', 'timeline', 'team'].map((tab) => (
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Synopsis</h3>
                  <p className="text-gray-600">{project.synopsis}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Production Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Director:</span>
                        <span className="font-medium">{project.director}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Producer:</span>
                        <span className="font-medium">{project.producer}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Casting Director:</span>
                        <span className="font-medium">{project.castingDirector}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{project.budget}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Union Status:</span>
                        <span className="font-medium">{project.union}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Schedule & Location</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Shooting Start:</span>
                        <span className="font-medium">{new Date(project.shootingStart).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Shooting End:</span>
                        <span className="font-medium">{new Date(project.shootingEnd).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{project.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Casting Roles</h3>
                  <button
                    onClick={() => setShowAddRole(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Role
                  </button>
                </div>

                <div className="space-y-4">
                  {project.roles.map((role: any) => (
                    <div
                      key={role.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{role.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleStatusColor(role.status)}`}>
                              {role.status}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{role.description}</p>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span>Gender: {role.gender}</span>
                            <span>Age: {role.ageRange}</span>
                            <span>Ethnicity: {role.ethnicity}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{role.submissions}</span>
                              <span className="text-gray-600"> submissions</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{role.callbacks}</span>
                              <span className="text-gray-600"> callbacks</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{role.shortlisted}</span>
                              <span className="text-gray-600"> shortlisted</span>
                            </div>
                          </div>
                          <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium">
                            View Submissions →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'auditions' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Scheduled Auditions</h3>
                  <button
                    onClick={() => setShowScheduleAudition(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule Audition
                  </button>
                </div>

                <div className="space-y-3">
                  {project.auditions.map((audition: any) => (
                    <div key={audition.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{audition.actorName}</h4>
                            <p className="text-sm text-gray-600">Role: {audition.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{new Date(audition.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">{audition.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <Check className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {audition.notes && (
                        <p className="mt-3 text-sm text-gray-600 italic">Note: {audition.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Production Timeline</h3>
                <div className="space-y-4">
                  {project.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${event.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{event.event}</p>
                            <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          {event.completed && (
                            <span className="text-green-600 text-sm">Completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div>
                <h3 className="text-lg font-semibold mb-6">Production Team</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Director</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div>
                        <p className="font-medium">{project.director}</p>
                        <p className="text-sm text-gray-600">director@production.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Producer</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div>
                        <p className="font-medium">{project.producer}</p>
                        <p className="text-sm text-gray-600">producer@production.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Casting Director</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full" />
                      <div>
                        <p className="font-medium">{project.castingDirector}</p>
                        <p className="text-sm text-gray-600">casting@production.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Add New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., Lead Character" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border rounded-lg px-3 py-2 h-24 resize-none" placeholder="Role description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option>Any</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="e.g., 25-35" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddRole(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Role added successfully');
                  setShowAddRole(false);
                }}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Audition Modal */}
      {showScheduleAudition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Schedule Audition</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Search actor..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  {project?.roles.map((role: any) => (
                    <option key={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowScheduleAudition(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Audition scheduled successfully');
                  setShowScheduleAudition(false);
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