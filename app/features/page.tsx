'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Video, Filter, Calendar, Users, BarChart3, Shield, 
  Smartphone, Zap, Globe, Bell, Cloud, Palette,
  ArrowRight, Check
} from 'lucide-react'

export default function FeaturesPage() {
  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: 'Professional Video Tools',
      description: 'Record, edit, and submit self-tapes directly from any device with built-in trimming, filters, and quality optimization.',
      category: 'core'
    },
    {
      icon: <Filter className="w-6 h-6" />,
      title: 'Advanced Filtering System',
      description: 'Filter through thousands of submissions instantly by archetype, demographics, union status, and custom tags.',
      category: 'core'
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Smart Scheduling',
      description: 'Automated audition scheduling with calendar sync, reminders, and conflict detection.',
      category: 'core'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Team Collaboration',
      description: 'Share projects, leave notes, and make casting decisions together in real-time.',
      category: 'collaboration'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics & Insights',
      description: 'Track submission rates, booking percentages, and career progress with detailed reports.',
      category: 'analytics'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, SSO support, and role-based access controls keep your data safe.',
      category: 'security'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile-First Design',
      description: 'Fully responsive interface optimized for touch with offline support and progressive web app features.',
      category: 'mobile'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Notifications',
      description: 'Real-time push notifications for auditions, callbacks, and bookings across all devices.',
      category: 'communication'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Global Talent Network',
      description: 'Connect with talent and projects worldwide with multi-language support and regional compliance.',
      category: 'network'
    }
  ]

  const benefits = {
    actor: [
      'Build a professional profile in minutes',
      'Submit to unlimited roles',
      'Track audition status in real-time',
      'Get discovered by top casting directors',
      'Manage your entire career from your phone'
    ],
    agent: [
      'Manage up to 500 clients efficiently',
      'Submit multiple clients with one click',
      'Track commission automatically',
      'Access detailed booking analytics',
      'Collaborate with casting teams directly'
    ],
    casting: [
      'Review thousands of submissions quickly',
      'Filter talent with precision',
      'Share selects with your team',
      'Manage multiple projects simultaneously',
      'Export reports and session notes'
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-heading font-bold gradient-text">
              Castingly
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-gray-700 hover:text-primary-600">
                About
              </Link>
              <Link href="/register" className="btn-touch bg-primary-600 text-white hover:bg-primary-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container-mobile text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-bold text-gray-900 mb-6"
          >
            Features That 
            <span className="gradient-text"> Transform Casting</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            Everything you need to succeed in the entertainment industry. 
            Powerful tools designed by industry professionals, for industry professionals.
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container-mobile">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits by Role */}
      <section className="py-20 px-4 bg-white">
        <div className="container-mobile">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Built for Every Role
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you're an actor, agent, or casting director, Castingly has the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Actor Benefits */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
              <div className="text-2xl mb-4">🎭</div>
              <h3 className="text-xl font-semibold mb-4">For Actors</h3>
              <ul className="space-y-3">
                {benefits.actor.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Agent Benefits */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8">
              <div className="text-2xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-4">For Agents</h3>
              <ul className="space-y-3">
                {benefits.agent.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Casting Director Benefits */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8">
              <div className="text-2xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold mb-4">For Casting Directors</h3>
              <ul className="space-y-3">
                {benefits.casting.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container-mobile">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Seamlessly Integrated
            </h2>
            <p className="text-gray-600 mb-12">
              Castingly works with the tools you already use and love.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">Google Calendar</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                  <Cloud className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">Dropbox</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                  <Bell className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">Slack</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                  <Palette className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600">Adobe Creative</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container-mobile text-center">
          <h2 className="text-3xl font-heading font-bold mb-6">
            Ready to Experience the Future of Casting?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who've already transformed their workflow with Castingly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="btn-touch bg-primary-600 text-white hover:bg-primary-700 text-lg px-8 inline-flex items-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}