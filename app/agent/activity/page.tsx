'use client';

import { useState } from 'react';
import { Calendar, Clock, TrendingUp, Award, Send, Users, FileText, Bell, Filter, ChevronRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AgentActivityPage() {
  const [timeFilter, setTimeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock activity data
  const activities = [
    {
      id: 1,
      type: 'submission',
      title: 'Submitted Emma Thompson',
      description: 'Submitted to "Downtown Medical" - Lead Role',
      time: '2 hours ago',
      status: 'pending',
      icon: Send,
      color: 'blue'
    },
    {
      id: 2,
      type: 'callback',
      title: 'Callback Scheduled',
      description: 'Michael Chen - "Netflix Original Series"',
      time: '5 hours ago',
      status: 'success',
      icon: CheckCircle,
      color: 'green',
      date: 'Feb 15, 2024 at 2:00 PM'
    },
    {
      id: 3,
      type: 'booking',
      title: 'Booking Confirmed!',
      description: 'Sarah Williams booked for "Tech Giant Commercial"',
      time: '1 day ago',
      status: 'success',
      icon: Award,
      color: 'purple',
      amount: '$5,000'
    },
    {
      id: 4,
      type: 'audition',
      title: 'Audition Tomorrow',
      description: 'James Rodriguez - "Feature Film" at Studio City',
      time: '1 day ago',
      status: 'upcoming',
      icon: Calendar,
      color: 'orange',
      date: 'Feb 10, 2024 at 10:00 AM'
    },
    {
      id: 5,
      type: 'rejection',
      title: 'Not Selected',
      description: 'Olivia Davis - "Drama Series" role filled',
      time: '2 days ago',
      status: 'rejected',
      icon: XCircle,
      color: 'red'
    },
    {
      id: 6,
      type: 'roster',
      title: 'New Talent Added',
      description: 'Alex Chen added to your roster',
      time: '3 days ago',
      status: 'success',
      icon: Users,
      color: 'indigo'
    },
    {
      id: 7,
      type: 'document',
      title: 'Documents Updated',
      description: 'Emma Thompson - New headshots uploaded',
      time: '3 days ago',
      status: 'info',
      icon: FileText,
      color: 'gray'
    },
    {
      id: 8,
      type: 'submission',
      title: 'Submitted Multiple Actors',
      description: '3 actors submitted to "Period Drama"',
      time: '4 days ago',
      status: 'pending',
      icon: Send,
      color: 'blue'
    },
    {
      id: 9,
      type: 'callback',
      title: 'Callback Request',
      description: 'Marcus Johnson - "Historical Series"',
      time: '5 days ago',
      status: 'success',
      icon: CheckCircle,
      color: 'green'
    },
    {
      id: 10,
      type: 'alert',
      title: 'Submission Deadline',
      description: 'Last day to submit for "Action Feature"',
      time: '6 days ago',
      status: 'warning',
      icon: AlertCircle,
      color: 'yellow'
    }
  ];

  // Stats data
  const stats = {
    weeklySubmissions: 24,
    activeAuditions: 8,
    callbacks: 5,
    bookings: 2,
    weeklyChange: {
      submissions: '+15%',
      auditions: '+20%',
      callbacks: '+40%',
      bookings: '0%'
    }
  };

  // Upcoming events
  const upcomingEvents = [
    {
      title: 'Michael Chen Audition',
      project: 'Netflix Series',
      date: 'Feb 15',
      time: '2:00 PM',
      location: 'Studio City'
    },
    {
      title: 'Emma Thompson Callback',
      project: 'Downtown Medical',
      date: 'Feb 16',
      time: '11:00 AM',
      location: 'Hollywood'
    },
    {
      title: 'Sarah Williams Fitting',
      project: 'Tech Commercial',
      date: 'Feb 18',
      time: '9:00 AM',
      location: 'Burbank'
    }
  ];

  const filteredActivities = activities.filter(activity => {
    if (typeFilter !== 'all' && activity.type !== typeFilter) return false;
    // Add time filtering logic here if needed
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your roster's auditions, callbacks, and bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stats.weeklyChange.submissions}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.weeklySubmissions}</p>
            <p className="text-sm text-gray-600">Weekly Submissions</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stats.weeklyChange.auditions}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeAuditions}</p>
            <p className="text-sm text-gray-600">Active Auditions</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">{stats.weeklyChange.callbacks}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.callbacks}</p>
            <p className="text-sm text-gray-600">Callbacks</p>
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">{stats.weeklyChange.bookings}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
            <p className="text-sm text-gray-600">Bookings</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="submission">Submissions</option>
                      <option value="callback">Callbacks</option>
                      <option value="booking">Bookings</option>
                      <option value="audition">Auditions</option>
                    </select>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {filteredActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          activity.color === 'blue' ? 'bg-blue-100' :
                          activity.color === 'green' ? 'bg-green-100' :
                          activity.color === 'purple' ? 'bg-purple-100' :
                          activity.color === 'orange' ? 'bg-orange-100' :
                          activity.color === 'red' ? 'bg-red-100' :
                          activity.color === 'indigo' ? 'bg-indigo-100' :
                          activity.color === 'yellow' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            activity.color === 'blue' ? 'text-blue-600' :
                            activity.color === 'green' ? 'text-green-600' :
                            activity.color === 'purple' ? 'text-purple-600' :
                            activity.color === 'orange' ? 'text-orange-600' :
                            activity.color === 'red' ? 'text-red-600' :
                            activity.color === 'indigo' ? 'text-indigo-600' :
                            activity.color === 'yellow' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              {activity.date && (
                                <p className="text-sm text-primary-600 mt-1">{activity.date}</p>
                              )}
                              {activity.amount && (
                                <p className="text-sm font-medium text-green-600 mt-1">{activity.amount}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t">
                <button className="w-full py-2 text-center text-primary-600 hover:text-primary-700 font-medium">
                  View All Activity
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-12 text-center flex-shrink-0">
                      <p className="text-xs text-gray-600">{event.date.split(' ')[0]}</p>
                      <p className="text-lg font-bold text-gray-900">{event.date.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1 border-l pl-3">
                      <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600">{event.project}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{event.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-center text-primary-600 hover:text-primary-700 text-sm font-medium">
                View Full Calendar
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Talent
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Manage Roster
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                <button className="w-full py-2 px-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Audition
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Performance Trends</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Submission Success</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Callback Rate</span>
                    <span className="text-sm font-medium">40%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Booking Rate</span>
                    <span className="text-sm font-medium">22%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '22%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}