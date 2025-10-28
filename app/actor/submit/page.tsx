'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Send,
  Upload,
  Video,
  FileText,
  Image as ImageIcon,
  Link,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Film,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import VideoUpload from '@/components/video/video-upload'
import useAuthStore from '@/lib/store/auth-store'

export const dynamic = 'force-dynamic'

// Mock opportunity data (would come from API based on ID)
const opportunityData = {
  id: '1',
  title: 'Lead Role in Indie Drama',
  project: 'Breaking Chains',
  type: 'Film',
  role: 'Daniel',
  description: 'A complex character dealing with family trauma and redemption. Looking for someone who can bring depth and authenticity to this emotionally challenging role.',
  requirements: {
    ageRange: '25-35',
    gender: 'Male',
    ethnicity: 'Any',
    union: 'SAG-AFTRA preferred'
  },
  location: 'Los Angeles, CA',
  dates: 'March 15 - April 30, 2024',
  compensation: 'SAG Scale',
  deadline: new Date(Date.now() + 86400000 * 7),
  castingDirector: 'Sarah Mitchell',
  submissionInstructions: 'Please submit a 2-3 minute self-tape performing the provided sides. Slate with your name, height, and location. Film in landscape orientation with good lighting and clear audio.',
  sides: 'Available for download after application'
}

function ActorSubmitInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get('opportunity')
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    coverLetter: '',
    availability: true,
    willingToTravel: true,
    additionalNotes: '',
    materials: {
      selfTape: null as any,
      headshots: [] as string[],
      resume: null as any,
      reel: null as any
    }
  })
  
  const [selectedMaterials, setSelectedMaterials] = useState({
    useProfileHeadshot: true,
    useProfileResume: true,
    useProfileReel: false
  })

  // Guard: this page should only be reached when applying for a role
  // If no opportunity id, route back to opportunities with a helpful message
  if (!opportunityId) {
    return (
      <Suspense fallback={null}>
      <AppLayout>
        <PageContent>
          <div className="max-w-md mx-auto text-center py-16">
            <h2 className="text-lg font-semibold mb-2">No role selected</h2>
            <p className="text-gray-600 mb-4">Choose a role from Opportunities to start an application.</p>
            <Button onClick={() => router.replace('/actor/opportunities')} variant="default">
              Browse Opportunities
            </Button>
          </div>
        </PageContent>
      </AppLayout>
      </Suspense>
    )
  }
  
  const handleVideoSelect = (video: any) => {
    setFormData({
      ...formData,
      materials: {
        ...formData.materials,
        selfTape: video
      }
    })
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsSubmitted(true)
  }
  
  if (isSubmitted) {
    return (
      <Suspense fallback={null}>
      <AppLayout>
        <PageContent>
          <div className="max-w-2xl mx-auto text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-heading font-bold mb-4">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-8">
              Your submission for <span className="font-semibold">{opportunityData.role}</span> in{' '}
              <span className="font-semibold">{opportunityData.project}</span> has been received.
              You'll be notified when the casting director reviews your materials.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => router.push('/actor/submissions')}
                variant="outline"
              >
                View Submissions
              </Button>
              <Button
                onClick={() => router.push('/actor/opportunities')}
              >
                Browse More Roles
              </Button>
            </div>
          </div>
      </PageContent>
      </AppLayout>
      </Suspense>
    )
  }
  
  return (
    <Suspense fallback={null}>
    <AppLayout>
      <PageHeader
        title="Submit Application"
        subtitle={`Applying for ${opportunityData.role} in ${opportunityData.project}`}
        actions={
          <Button
            onClick={() => router.back()}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />
      
      <PageContent>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="flex items-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors',
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-full h-1 mx-2',
                      step > s ? 'bg-primary-600' : 'bg-gray-200'
                    )}
                    style={{ width: '100px' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-2xl mx-auto mt-2">
            <span className="text-sm text-gray-600">Review Role</span>
            <span className="text-sm text-gray-600">Upload Materials</span>
            <span className="text-sm text-gray-600">Submit</span>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Review Role */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Role Details</CardTitle>
                  <CardDescription>Review the requirements before applying</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-gray-600">{opportunityData.description}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>• Age: {opportunityData.requirements.ageRange}</p>
                          <p>• Gender: {opportunityData.requirements.gender}</p>
                          <p>• Ethnicity: {opportunityData.requirements.ethnicity}</p>
                          <p>• Union: {opportunityData.requirements.union}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Production Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{opportunityData.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{opportunityData.dates}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span>{opportunityData.compensation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Deadline: {opportunityData.deadline.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-900 mb-1">
                            Submission Instructions
                          </h4>
                          <p className="text-sm text-yellow-800">
                            {opportunityData.submissionInstructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Cover Letter</CardTitle>
                  <CardDescription>Tell us why you're perfect for this role</CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-32"
                    placeholder="Dear Casting Director..."
                    value={formData.coverLetter}
                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  />
                  
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm">I am available for the entire production period</span>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.willingToTravel}
                        onChange={(e) => setFormData({ ...formData, willingToTravel: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <span className="text-sm">I am willing to travel if required</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setStep(2)}>
                  Continue to Materials
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Upload Materials */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Self-Tape</CardTitle>
                  <CardDescription>Upload your audition video</CardDescription>
                </CardHeader>
                <CardContent>
                  <VideoUpload
                    onVideoSelect={handleVideoSelect}
                    maxSize={500}
                    maxDuration={300}
                  />
                  {formData.materials.selfTape && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">
                          Self-tape uploaded successfully
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Additional Materials</CardTitle>
                  <CardDescription>Select from your profile or upload new</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Headshot</p>
                          <p className="text-sm text-gray-600">Use primary headshot from profile</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.useProfileHeadshot}
                        onChange={(e) => setSelectedMaterials({
                          ...selectedMaterials,
                          useProfileHeadshot: e.target.checked
                        })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Resume</p>
                          <p className="text-sm text-gray-600">Use current resume from profile</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.useProfileResume}
                        onChange={(e) => setSelectedMaterials({
                          ...selectedMaterials,
                          useProfileResume: e.target.checked
                        })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Demo Reel</p>
                          <p className="text-sm text-gray-600">Include your demo reel</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMaterials.useProfileReel}
                        onChange={(e) => setSelectedMaterials({
                          ...selectedMaterials,
                          useProfileReel: e.target.checked
                        })}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" className="mt-4" fullWidth>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Additional Files
                  </Button>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={!formData.materials.selfTape}
                >
                  Review & Submit
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Application</CardTitle>
                  <CardDescription>Make sure everything looks good before submitting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Role Summary */}
                    <div>
                      <h4 className="font-medium mb-2">Applying For</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium">{opportunityData.role} in {opportunityData.project}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {opportunityData.type} • {opportunityData.location} • {opportunityData.dates}
                        </p>
                      </div>
                    </div>
                    
                    {/* Cover Letter */}
                    <div>
                      <h4 className="font-medium mb-2">Cover Letter</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {formData.coverLetter || 'No cover letter provided'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Materials */}
                    <div>
                      <h4 className="font-medium mb-2">Materials</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Self-tape uploaded</span>
                        </div>
                        {selectedMaterials.useProfileHeadshot && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Headshot from profile</span>
                          </div>
                        )}
                        {selectedMaterials.useProfileResume && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Resume from profile</span>
                          </div>
                        )}
                        {selectedMaterials.useProfileReel && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Demo reel included</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Availability */}
                    <div>
                      <h4 className="font-medium mb-2">Availability</h4>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          {formData.availability ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                          Available for entire production period
                        </p>
                        <p className="flex items-center gap-2">
                          {formData.willingToTravel ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                          Willing to travel if required
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between mt-6">
                <Button onClick={() => setStep(2)} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </PageContent>
    </AppLayout>
    </Suspense>
  )
}

export default function ActorSubmit() {
  return (
    <Suspense fallback={null}>
      <ActorSubmitInner />
    </Suspense>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
