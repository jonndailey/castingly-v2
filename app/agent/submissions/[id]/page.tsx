'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, Calendar, Clock, MapPin, DollarSign, 
  FileText, Video, Download, Send, CheckCircle,
  XCircle, AlertCircle, User, Film, Building,
  Mail, Phone, Globe, Star, MessageSquare,
  ChevronRight, Edit, Trash2, ExternalLink
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'

export default function AgentSubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  // Mock data for the submission
  const submission = {
    id: params.id,
    clientName: 'Emily Rodriguez',
    clientId: 'client-123',
    projectTitle: 'Sunset Boulevard',
    projectType: 'Feature Film',
    role: 'Sarah Walker',
    roleType: 'Lead',
    submittedAt: '2024-01-15T10:30:00',
    status: 'under_review',
    castingDirector: 'Jennifer Mills',
    productionCompany: 'Paramount Pictures',
    shootingLocation: 'Los Angeles, CA',
    shootingDates: 'March 15 - May 20, 2024',
    rate: '$2,500/day',
    unionStatus: 'SAG-AFTRA',
    auditionDate: '2024-01-25T14:00:00',
    auditionLocation: 'Sunset Gower Studios, Stage 12',
    auditionType: 'In-Person',
    materials: {
      headshot: '/headshot.jpg',
      resume: '/resume.pdf',
      reel: 'https://vimeo.com/123456789',
      selftape: 'https://vimeo.com/987654321',
      sides: '/sides.pdf'
    },
    notes: [
      {
        id: 1,
        author: 'You',
        time: '2 hours ago',
        content: 'Client is very excited about this opportunity. She has prepared extensively for the role.'
      },
      {
        id: 2,
        author: 'Casting',
        time: '1 day ago',
        content: 'Great submission! We would like to see Emily for a callback.'
      }
    ],
    timeline: [
      {
        date: '2024-01-15',
        event: 'Submission sent',
        status: 'completed'
      },
      {
        date: '2024-01-16',
        event: 'Submission viewed',
        status: 'completed'
      },
      {
        date: '2024-01-17',
        event: 'Callback requested',
        status: 'completed'
      },
      {
        date: '2024-01-25',
        event: 'Audition scheduled',
        status: 'upcoming'
      }
    ],
    commission: {
      rate: 10,
      estimatedEarnings: '$12,500',
      yourCommission: '$1,250'
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      under_review: {
        label: 'Under Review',
        className: 'bg-blue-100 text-blue-700',
        icon: <AlertCircle className="w-4 h-4" />
      },
      callback: {
        label: 'Callback',
        className: 'bg-purple-100 text-purple-700',
        icon: <Star className="w-4 h-4" />
      },
      rejected: {
        label: 'Passed',
        className: 'bg-gray-100 text-gray-700',
        icon: <XCircle className="w-4 h-4" />
      },
      booked: {
        label: 'Booked',
        className: 'bg-green-100 text-green-700',
        icon: <CheckCircle className="w-4 h-4" />
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.under_review
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Submission Details"
        subtitle={`${submission.clientName} - ${submission.projectTitle}`}
        actions={
          <div className="flex items-center gap-3">
            <button className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="btn-touch bg-red-100 text-red-700 hover:bg-red-200"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Withdraw
            </button>
          </div>
        }
      />

      <PageContent>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </button>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{submission.role}</h3>
                  <p className="text-gray-600">{submission.roleType} Role</p>
                </div>
                {getStatusBadge(submission.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Project</p>
                  <p className="font-medium">{submission.projectTitle}</p>
                  <p className="text-sm text-gray-600">{submission.projectType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Production</p>
                  <p className="font-medium">{submission.productionCompany}</p>
                  <p className="text-sm text-gray-600">{submission.castingDirector}</p>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="card">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['overview', 'materials', 'notes', 'timeline'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-primary-600 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Audition Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">January 25, 2024</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="font-medium">2:00 PM PST</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{submission.auditionLocation}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Video className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">{submission.auditionType}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Production Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Shooting Location</p>
                            <p className="font-medium">{submission.shootingLocation}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Shooting Dates</p>
                            <p className="font-medium">{submission.shootingDates}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Rate</p>
                            <p className="font-medium">{submission.rate}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Union Status</p>
                            <p className="font-medium">{submission.unionStatus}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Materials Tab */}
                {activeTab === 'materials' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <a
                        href={submission.materials.headshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-grow">
                          <p className="font-medium">Headshot</p>
                          <p className="text-sm text-gray-500">View</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>

                      <a
                        href={submission.materials.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-grow">
                          <p className="font-medium">Resume</p>
                          <p className="text-sm text-gray-500">PDF</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>

                      <a
                        href={submission.materials.reel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Video className="w-5 h-5 text-gray-400" />
                        <div className="flex-grow">
                          <p className="font-medium">Demo Reel</p>
                          <p className="text-sm text-gray-500">3:45</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>

                      <a
                        href={submission.materials.selftape}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Video className="w-5 h-5 text-gray-400" />
                        <div className="flex-grow">
                          <p className="font-medium">Self-Tape</p>
                          <p className="text-sm text-gray-500">5:12</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Tip:</strong> Make sure your client's materials are up to date and showcase their best work for this role.
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes Tab */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {submission.notes.map((note) => (
                      <div key={note.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{note.author}</p>
                            <span className="text-xs text-gray-500">{note.time}</span>
                          </div>
                          <p className="text-gray-700">{note.content}</p>
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <textarea
                        placeholder="Add a note..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                      />
                      <button className="mt-3 btn-touch bg-primary-600 text-white hover:bg-primary-700">
                        <Send className="w-4 h-4 mr-2" />
                        Add Note
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {submission.timeline.map((item, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            item.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          {index < submission.timeline.length - 1 && (
                            <div className="w-0.5 h-16 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-grow pb-8">
                          <p className="font-medium">{item.event}</p>
                          <p className="text-sm text-gray-500">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Client & Commission Info */}
          <div className="space-y-6">
            {/* Client Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="font-semibold mb-4">Client Information</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={`https://ui-avatars.com/api/?name=${submission.clientName}&background=6366f1&color=fff`}
                  alt={submission.clientName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-medium">{submission.clientName}</p>
                  <p className="text-sm text-gray-500">Actor</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  href={`/agent/roster/${submission.clientId}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium">View Full Profile</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
                
                <button className="w-full flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Contact Client</span>
                </button>
              </div>
            </motion.div>

            {/* Commission Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="font-semibold mb-4">Commission Details</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Commission Rate</p>
                  <p className="text-lg font-semibold">{submission.commission.rate}%</p>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Estimated Project Earnings</p>
                  <p className="text-lg font-semibold">{submission.commission.estimatedEarnings}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Your Commission</p>
                  <p className="text-2xl font-bold text-green-600">{submission.commission.yourCommission}</p>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    * Commission calculated based on estimated shooting days and day rate. 
                    Actual earnings may vary.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Add to Calendar</p>
                      <p className="text-xs text-gray-500">Sync audition to calendar</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Message Casting</p>
                      <p className="text-xs text-gray-500">Send a message</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Update Materials</p>
                      <p className="text-xs text-gray-500">Replace submission files</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </PageContent>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold mb-3">Withdraw Submission?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to withdraw this submission? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button className="flex-1 btn-touch bg-red-600 text-white hover:bg-red-700">
                Withdraw
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppLayout>
  )
}