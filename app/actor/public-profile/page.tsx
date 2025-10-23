'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Globe, Eye, EyeOff, Save, ArrowLeft, Copy, ExternalLink,
  User, Mail, Phone, MapPin, Calendar, Film, Award, 
  Languages, Camera, Video, FileText, Check, X, Info,
  Lock, Unlock, Sparkles, Share2, Link2
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'

interface PrivacySettings {
  showEmail: boolean
  showPhone: boolean
  showAge: boolean
  showFullName: boolean
  showLocation: boolean
  showUnion: boolean
  showAgent: boolean
  showSocialMedia: boolean
  showResume: boolean
  showReels: boolean
  showHeadshots: boolean
  showExperience: boolean
  showTraining: boolean
  showSkills: boolean
  showPhysicalAttributes: boolean
  showArchetypes: boolean
}

export default function PublicProfileConfigPage() {
  const router = useRouter()
  const [profileUrl, setProfileUrl] = useState('jackconnelly')
  const [isUrlAvailable, setIsUrlAvailable] = useState(true)
  const [profileEnabled, setProfileEnabled] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    showEmail: false,
    showPhone: false,
    showAge: false,
    showFullName: true,
    showLocation: true,
    showUnion: true,
    showAgent: true,
    showSocialMedia: true,
    showResume: true,
    showReels: true,
    showHeadshots: true,
    showExperience: true,
    showTraining: true,
    showSkills: true,
    showPhysicalAttributes: true,
    showArchetypes: true
  })

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://castingly.com/talent/${profileUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    // Save settings
    router.push('/actor/profile')
  }

  const privacySections = [
    {
      title: 'Basic Information',
      description: 'Control what personal information is visible',
      items: [
        { key: 'showFullName', label: 'Full Name', icon: <User className="w-4 h-4" /> },
        { key: 'showEmail', label: 'Email Address', icon: <Mail className="w-4 h-4" />, warning: true },
        { key: 'showPhone', label: 'Phone Number', icon: <Phone className="w-4 h-4" />, warning: true },
        { key: 'showAge', label: 'Age/Birthday', icon: <Calendar className="w-4 h-4" /> },
        { key: 'showLocation', label: 'Location', icon: <MapPin className="w-4 h-4" /> },
        { key: 'showUnion', label: 'Union Status', icon: <Award className="w-4 h-4" /> },
        { key: 'showAgent', label: 'Agent Information', icon: <User className="w-4 h-4" /> },
        { key: 'showSocialMedia', label: 'Social Media Links', icon: <Share2 className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Professional Materials',
      description: 'Choose which materials to display publicly',
      items: [
        { key: 'showHeadshots', label: 'Headshots', icon: <Camera className="w-4 h-4" /> },
        { key: 'showReels', label: 'Demo Reels', icon: <Video className="w-4 h-4" /> },
        { key: 'showResume', label: 'Acting Resume', icon: <FileText className="w-4 h-4" /> },
        { key: 'showExperience', label: 'Experience', icon: <Film className="w-4 h-4" /> },
        { key: 'showTraining', label: 'Training & Education', icon: <Award className="w-4 h-4" /> }
      ]
    },
    {
      title: 'Profile Details',
      description: 'Additional profile information',
      items: [
        { key: 'showSkills', label: 'Special Skills', icon: <Sparkles className="w-4 h-4" /> },
        { key: 'showPhysicalAttributes', label: 'Physical Attributes', icon: <User className="w-4 h-4" /> },
        { key: 'showArchetypes', label: 'Character Types', icon: <Languages className="w-4 h-4" /> }
      ]
    }
  ]

  return (
    <AppLayout>
      <PageHeader
        title="Public Profile Settings"
        subtitle="Configure your publicly accessible professional profile"
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <button
              onClick={handleSave}
              className="btn-touch bg-primary-600 text-white hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        }
      />

      <PageContent>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Premium Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-gray-900 mb-1">Premium Feature</h3>
                <p className="text-sm text-gray-600">
                  Public profiles are available to premium members. Share your professional profile 
                  with casting directors, agents, and collaborators without requiring them to create an account.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Profile URL Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Profile URL</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileEnabled(!profileEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profileEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profileEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium">
                  {profileEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Profile URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm">
                        castingly.com/talent/
                      </span>
                      <input
                        type="text"
                        value={profileUrl}
                        onChange={(e) => setProfileUrl(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-grow px-3 py-2 focus:outline-none"
                        placeholder="yourname"
                      />
                    </div>
                    {isUrlAvailable ? (
                      <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        This URL is available
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        This URL is already taken
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(`/talent/${profileUrl}`, '_blank')}
                    className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Info className="w-4 h-4 inline mr-1" />
                  Your public profile will be accessible to anyone with this link, even without a Castingly account.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Settings */}
          {privacySections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIndex * 0.1 }}
              className="card p-6"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{section.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">{item.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        {item.warning && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            ⚠️ Sharing this publicly may impact your privacy
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setPrivacySettings({
                        ...privacySettings,
                        [item.key]: !privacySettings[item.key as keyof PrivacySettings]
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        privacySettings[item.key as keyof PrivacySettings] 
                          ? 'bg-primary-600' 
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          privacySettings[item.key as keyof PrivacySettings]
                            ? 'translate-x-6' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Share Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Share Your Profile</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">QR Code</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Download a QR code that links directly to your profile
                </p>
                <button className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">
                  Generate QR Code
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Email Signature</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Add your profile link to your email signature
                </p>
                <button className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">
                  Copy Signature
                </button>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end gap-3 pt-6 border-t border-gray-200"
          >
            <button
              onClick={() => router.back()}
              className="btn-touch bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-touch bg-primary-600 text-white hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </motion.div>
        </div>
      </PageContent>
    </AppLayout>
  )
}