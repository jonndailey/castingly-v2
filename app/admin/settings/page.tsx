'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Save,
  RefreshCw,
  Mail,
  Shield,
  Globe,
  Database,
  Bell,
  Upload,
  Key,
  Users,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SystemSettings {
  general: {
    siteName: string
    siteDescription: string
    contactEmail: string
    supportEmail: string
    timezone: string
    dateFormat: string
    maintenanceMode: boolean
  }
  email: {
    provider: 'sendgrid' | 'smtp' | 'mailgun'
    sendgridApiKey: string
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  security: {
    requireEmailVerification: boolean
    passwordMinLength: number
    passwordRequireUppercase: boolean
    passwordRequireNumbers: boolean
    passwordRequireSymbols: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    accountLockoutDuration: number
    twoFactorEnabled: boolean
  }
  uploads: {
    maxFileSize: number
    allowedImageTypes: string[]
    allowedVideoTypes: string[]
    allowedDocumentTypes: string[]
    imageQuality: number
    generateThumbnails: boolean
    storageProvider: 's3' | 'local' | 'cloudinary'
    s3Bucket: string
    s3Region: string
    s3AccessKey: string
    s3SecretKey: string
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    notifyOnNewUser: boolean
    notifyOnPasswordReset: boolean
    notifyOnSystemError: boolean
    notifyOnHighUsage: boolean
  }
  features: {
    userRegistrationEnabled: boolean
    publicProfilesEnabled: boolean
    messagingEnabled: boolean
    submissionSystemEnabled: boolean
    analyticsEnabled: boolean
    maintenancePageEnabled: boolean
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [activeTab, setActiveTab] = useState('general')
  const [showPasswords, setShowPasswords] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return
    
    setSettings(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'uploads', name: 'File Uploads', icon: Upload },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'features', name: 'Features', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
            <p className="text-gray-600">Configure platform settings and preferences</p>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Settings saved successfully
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Failed to save settings
              </div>
            )}
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="lg:w-1/4">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.name}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:w-3/4">
            {settings && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'general' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Name
                        </label>
                        <Input
                          value={settings.general.siteName}
                          onChange={(e) => updateSettings('general', 'siteName', e.target.value)}
                          placeholder="Enter site name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Site Description
                        </label>
                        <textarea
                          value={settings.general.siteDescription}
                          onChange={(e) => updateSettings('general', 'siteDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          placeholder="Enter site description"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                          </label>
                          <Input
                            type="email"
                            value={settings.general.contactEmail}
                            onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
                            placeholder="contact@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Support Email
                          </label>
                          <Input
                            type="email"
                            value={settings.general.supportEmail}
                            onChange={(e) => updateSettings('general', 'supportEmail', e.target.value)}
                            placeholder="support@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={settings.general.timezone}
                            onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Format
                          </label>
                          <select
                            value={settings.general.dateFormat}
                            onChange={(e) => updateSettings('general', 'dateFormat', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="maintenanceMode"
                          checked={settings.general.maintenanceMode}
                          onChange={(e) => updateSettings('general', 'maintenanceMode', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                          Enable Maintenance Mode
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'email' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Provider
                        </label>
                        <select
                          value={settings.email.provider}
                          onChange={(e) => updateSettings('email', 'provider', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="sendgrid">SendGrid</option>
                          <option value="smtp">SMTP</option>
                          <option value="mailgun">Mailgun</option>
                        </select>
                      </div>

                      {settings.email.provider === 'sendgrid' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SendGrid API Key
                          </label>
                          <div className="relative">
                            <Input
                              type={showPasswords ? 'text' : 'password'}
                              value={settings.email.sendgridApiKey}
                              onChange={(e) => updateSettings('email', 'sendgridApiKey', e.target.value)}
                              placeholder="Enter SendGrid API key"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Email
                          </label>
                          <Input
                            type="email"
                            value={settings.email.fromEmail}
                            onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                            placeholder="noreply@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From Name
                          </label>
                          <Input
                            value={settings.email.fromName}
                            onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                            placeholder="Your Company Name"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'security' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="requireEmailVerification"
                            checked={settings.security.requireEmailVerification}
                            onChange={(e) => updateSettings('security', 'requireEmailVerification', e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700">
                            Require Email Verification
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="twoFactorEnabled"
                            checked={settings.security.twoFactorEnabled}
                            onChange={(e) => updateSettings('security', 'twoFactorEnabled', e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor="twoFactorEnabled" className="text-sm font-medium text-gray-700">
                            Enable Two-Factor Authentication
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Password Length
                          </label>
                          <Input
                            type="number"
                            value={settings.security.passwordMinLength}
                            onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                            min="6"
                            max="50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <Input
                            type="number"
                            value={settings.security.sessionTimeout}
                            onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                            min="15"
                            max="1440"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Password Requirements</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="passwordRequireUppercase"
                              checked={settings.security.passwordRequireUppercase}
                              onChange={(e) => updateSettings('security', 'passwordRequireUppercase', e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="passwordRequireUppercase" className="text-sm text-gray-700">
                              Require uppercase letters
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="passwordRequireNumbers"
                              checked={settings.security.passwordRequireNumbers}
                              onChange={(e) => updateSettings('security', 'passwordRequireNumbers', e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="passwordRequireNumbers" className="text-sm text-gray-700">
                              Require numbers
                            </label>
                          </div>

                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="passwordRequireSymbols"
                              checked={settings.security.passwordRequireSymbols}
                              onChange={(e) => updateSettings('security', 'passwordRequireSymbols', e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor="passwordRequireSymbols" className="text-sm text-gray-700">
                              Require special characters
                            </label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'features' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Feature Toggles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">User Registration</h4>
                            <p className="text-sm text-gray-600">Allow new users to register accounts</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.userRegistrationEnabled}
                            onChange={(e) => updateSettings('features', 'userRegistrationEnabled', e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Public Profiles</h4>
                            <p className="text-sm text-gray-600">Allow users to have public profiles</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.publicProfilesEnabled}
                            onChange={(e) => updateSettings('features', 'publicProfilesEnabled', e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Messaging System</h4>
                            <p className="text-sm text-gray-600">Enable internal messaging between users</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.messagingEnabled}
                            onChange={(e) => updateSettings('features', 'messagingEnabled', e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Submission System</h4>
                            <p className="text-sm text-gray-600">Allow actors to submit for casting calls</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.submissionSystemEnabled}
                            onChange={(e) => updateSettings('features', 'submissionSystemEnabled', e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">Analytics</h4>
                            <p className="text-sm text-gray-600">Collect usage analytics and metrics</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.features.analyticsEnabled}
                            onChange={(e) => updateSettings('features', 'analyticsEnabled', e.target.checked)}
                            className="rounded"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}