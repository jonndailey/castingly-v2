'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  Phone,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Filter,
  Download
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock audition data
const scheduledAuditions = [
  {
    id: '1',
    actor: {
      name: 'Marcus Johnson',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=MJ'
    },
    project: 'Shadow Protocol',
    role: 'Agent Marcus Stone',
    date: new Date(Date.now() + 86400000),
    time: '10:00 AM',
    duration: 30,
    type: 'callback',
    location: 'Studio A - Mitchell Casting',
    status: 'confirmed',
    notes: 'Bring comfortable clothes for action sequences'
  },
  {
    id: '2',
    actor: {
      name: 'Elena Rodriguez',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=ER'
    },
    project: 'The Last Resort',
    role: 'Resort Manager',
    date: new Date(Date.now() + 86400000 * 2),
    time: '2:30 PM',
    duration: 45,
    type: 'callback',
    location: 'Virtual - Zoom',
    status: 'pending',
    notes: 'Chemistry read with potential co-star'
  }
]

export default function AuditionScheduling() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  return (
    <AppLayout>
      <PageHeader
        title="Audition Scheduling"
        subtitle="Manage auditions and callbacks for your projects"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Audition
            </Button>
          </div>
        }
      />
      
      <PageContent>
        <div className="space-y-4">
          {scheduledAuditions.map((audition, index) => (
            <motion.div
              key={audition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <img src={audition.actor.avatar} alt={audition.actor.name} />
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{audition.actor.name}</h3>
                        <p className="text-gray-600">{audition.project} - {audition.role}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {audition.date.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {audition.time} ({audition.duration}min)
                          </div>
                          <div className="flex items-center gap-1">
                            {audition.location.includes('Virtual') ? (
                              <Video className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                            {audition.location}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={audition.status === 'confirmed' ? 'success' : 'warning'}
                      >
                        {audition.status === 'confirmed' ? 
                          <CheckCircle className="w-3 h-3 mr-1" /> : 
                          <AlertCircle className="w-3 h-3 mr-1" />
                        }
                        {audition.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {audition.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{audition.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageContent>
    </AppLayout>
  )
}