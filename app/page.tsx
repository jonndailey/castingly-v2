'use client'

import { useState } from 'react'
import Link from 'next/link'
import useAuthStore from '@/lib/store/auth-store'

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()

  // Development helper to clear auth state
  const handleClearAuth = async () => {
    await logout()
    console.log('🎭 Auth state cleared')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-heading font-bold gradient-text">
                Castingly
              </h1>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-gray-700 hover:text-primary-600 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
                About
              </Link>
              {user ? (
                <button 
                  onClick={handleClearAuth}
                  className="btn-touch bg-red-600 text-white hover:bg-red-700"
                >
                  Clear Auth & Sign In
                </button>
              ) : (
                <Link 
                  href="/login"
                  className="btn-touch bg-primary-600 text-white hover:bg-primary-700"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 animate-slide-down">
            <div className="container-mobile py-4 space-y-2">
              <Link href="/features" className="block py-3 text-gray-700">Features</Link>
              <Link href="/pricing" className="block py-3 text-gray-700">Pricing</Link>
              <Link href="/about" className="block py-3 text-gray-700">About</Link>
              {user ? (
                <button 
                  onClick={handleClearAuth}
                  className="block btn-touch bg-red-600 text-white text-center w-full"
                >
                  Clear Auth & Sign In
                </button>
              ) : (
                <Link href="/login" className="block btn-touch bg-primary-600 text-white text-center">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container-mobile text-center">
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
            Where Talent Meets
            <span className="gradient-text"> Opportunity</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The professional casting platform that connects actors, agents, and casting directors 
            in one seamless, mobile-first experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="btn-touch bg-primary-600 text-white hover:bg-primary-700 text-lg px-8"
            >
              Get Started Free
            </Link>
            <Link 
              href="/demo"
              className="btn-touch bg-white text-primary-600 border-2 border-primary-600 hover:bg-primary-50 text-lg px-8"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* User Type Cards */}
      <section className="py-20 px-4" id="for-you">
        <div className="container-mobile">
          <h3 className="text-3xl font-heading font-bold text-center mb-12">
            Built for the Entertainment Industry
          </h3>
          
          <div className="grid-responsive">
            {/* Actor Card */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h4 className="text-xl font-heading font-semibold mb-2">For Actors</h4>
              <p className="text-gray-600">
                Build your profile, submit to roles, and track your auditions all from your phone.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Professional profile builder
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Video submission tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Real-time notifications
                </li>
              </ul>
            </div>

            {/* Agent Card */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h4 className="text-xl font-heading font-semibold mb-2">For Agents</h4>
              <p className="text-gray-600">
                Manage your roster, submit clients to roles, and track bookings efficiently.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Client roster management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Bulk submission tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Commission tracking
                </li>
              </ul>
            </div>

            {/* Casting Director Card */}
            <div className="card p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h4 className="text-xl font-heading font-semibold mb-2">For Casting Directors</h4>
              <p className="text-gray-600">
                Post projects, review submissions, and manage auditions with powerful tools.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Advanced filtering system
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Video review queue
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Team collaboration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50" id="features">
        <div className="container-mobile">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-heading font-bold mb-4">
              Powerful Features for Every Role
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to succeed in the entertainment industry, all in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Video Submissions</h4>
              <p className="text-gray-600 text-sm">
                Record and submit self-tapes directly from your device with built-in editing tools.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Smart Filtering</h4>
              <p className="text-gray-600 text-sm">
                Quickly filter through thousands of submissions by archetype, demographics, and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Audition Calendar</h4>
              <p className="text-gray-600 text-sm">
                Keep track of all your auditions, callbacks, and bookings in one organized calendar.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Team Collaboration</h4>
              <p className="text-gray-600 text-sm">
                Share projects with your team and collaborate on casting decisions in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Analytics Dashboard</h4>
              <p className="text-gray-600 text-sm">
                Track submission stats, booking rates, and career progress with detailed analytics.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">Secure & Private</h4>
              <p className="text-gray-600 text-sm">
                Industry-standard security with encrypted data and role-based access controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-First Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container-mobile">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-heading font-bold mb-6">
                Designed for Mobile,
                <span className="gradient-text"> Built for Professionals</span>
              </h3>
              <p className="text-gray-600 mb-6">
                Whether you're on set, in the office, or on the go, Castingly works seamlessly 
                across all your devices. Review auditions with swipe gestures, submit to roles 
                with one tap, and never miss an opportunity.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Touch-Optimized Interface</h4>
                    <p className="text-sm text-gray-600">
                      Large touch targets and intuitive gestures make navigation effortless.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Offline Support</h4>
                    <p className="text-sm text-gray-600">
                      Continue working even without internet. Changes sync when you reconnect.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Video Handling</h4>
                    <p className="text-sm text-gray-600">
                      Adaptive streaming ensures smooth playback on any connection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative mx-auto w-64 h-[512px] bg-gray-900 rounded-[3rem] shadow-xl">
                <div className="absolute inset-x-0 top-0 h-6 bg-gray-900 rounded-t-[3rem]"></div>
                <div className="absolute inset-2 top-8 bg-white rounded-[2.5rem] overflow-hidden">
                  {/* Mock mobile screen */}
                  <div className="h-full bg-gradient-to-br from-purple-50 to-teal-50 p-4">
                    <div className="space-y-3">
                      <div className="skeleton h-32 rounded-xl"></div>
                      <div className="skeleton h-20 rounded-lg"></div>
                      <div className="skeleton h-20 rounded-lg"></div>
                      <div className="skeleton h-20 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-50" id="pricing">
        <div className="container-mobile">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-heading font-bold mb-4">
              Simple, Transparent Pricing
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for you. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Actor Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">Actor</h4>
                <p className="text-gray-600 text-sm mb-4">Perfect for individual performers</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$9</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Unlimited submissions</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Professional profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Video hosting (5GB)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Real-time notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Mobile app access</span>
                </li>
              </ul>
              
              <Link 
                href="/register?plan=actor" 
                className="btn-touch w-full text-center bg-primary-600 text-white hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Agent Plan */}
            <div className="bg-white rounded-2xl border-2 border-primary-600 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">Agent</h4>
                <p className="text-gray-600 text-sm mb-4">For talent representatives</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$49</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Everything in Actor</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Up to 50 client profiles</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Bulk submission tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Commission tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Video hosting (50GB)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>
              
              <Link 
                href="/register?plan=agent" 
                className="btn-touch w-full text-center bg-primary-600 text-white hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Casting Director Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
              <div className="mb-6">
                <h4 className="text-xl font-semibold mb-2">Casting Director</h4>
                <p className="text-gray-600 text-sm mb-4">For casting professionals</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">$99</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Unlimited projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Advanced filtering</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Team collaboration</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Video hosting (100GB)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Custom workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">Dedicated support</span>
                </li>
              </ul>
              
              <Link 
                href="/register?plan=casting" 
                className="btn-touch w-full text-center bg-primary-600 text-white hover:bg-primary-700"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Enterprise */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Need a custom solution for your studio or production company?
            </p>
            <Link 
              href="/contact" 
              className="inline-flex btn-touch border-2 border-primary-600 text-primary-600 hover:bg-primary-50"
            >
              Contact Sales for Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-white" id="about">
        <div className="container-mobile">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-heading font-bold mb-4">
                About Castingly
              </h3>
              <p className="text-gray-600 text-lg">
                Empowering the entertainment industry since 2020
              </p>
            </div>

            <div className="prose prose-gray max-w-none">
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-xl font-semibold mb-4">Our Mission</h4>
                  <p className="text-gray-600">
                    Castingly was born from a simple observation: the casting process was stuck in the past. 
                    While other industries embraced digital transformation, casting still relied on outdated 
                    methods that wasted time and missed opportunities.
                  </p>
                  <p className="text-gray-600 mt-4">
                    We set out to build a platform that works the way professionals actually work - on the go, 
                    collaboratively, and with powerful tools that make decisions easier, not harder.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold mb-4">Our Values</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 font-semibold">Accessibility:</span>
                      <span>Everyone deserves a shot at their dreams, regardless of location or connections.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 font-semibold">Innovation:</span>
                      <span>We constantly push boundaries to make casting faster, fairer, and more efficient.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-600 font-semibold">Community:</span>
                      <span>We're building more than software - we're fostering connections that create art.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-y border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">50K+</div>
                  <div className="text-sm text-gray-600 mt-1">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">1M+</div>
                  <div className="text-sm text-gray-600 mt-1">Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">5K+</div>
                  <div className="text-sm text-gray-600 mt-1">Productions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">98%</div>
                  <div className="text-sm text-gray-600 mt-1">Satisfaction</div>
                </div>
              </div>

              {/* Team */}
              <div className="mt-12">
                <h4 className="text-xl font-semibold mb-6 text-center">Built by Industry Professionals</h4>
                <p className="text-gray-600 text-center max-w-3xl mx-auto">
                  Our team includes former casting directors, agents, actors, and technologists who understand 
                  the unique challenges of the entertainment industry. We're not just building software - 
                  we're solving problems we've experienced firsthand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container-mobile text-center">
          <h3 className="text-3xl font-heading font-bold mb-6 text-white">
            Ready to Transform Your Casting Process?
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of industry professionals already using Castingly to 
            streamline their workflow and discover amazing talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="btn-touch bg-white text-primary-600 hover:bg-gray-100 text-lg px-8"
            >
              Start Your Free Trial
            </Link>
            <Link 
              href="/demo"
              className="btn-touch border-2 border-white text-white hover:bg-white/10 text-lg px-8"
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container-mobile">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-heading font-bold text-xl mb-4">Castingly</h4>
              <p className="text-gray-400 text-sm">
                The professional casting platform for the entertainment industry.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Product</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Company</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2024 Castingly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}