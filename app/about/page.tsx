'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Target, Heart, Sparkles, Award, Globe } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Accessibility',
      description: 'Everyone deserves a shot at their dreams, regardless of location, connections, or background.'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Innovation',
      description: 'We constantly push boundaries to make casting faster, fairer, and more efficient for everyone.'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Community',
      description: "We're building more than software - we're fostering connections that create amazing art."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Excellence',
      description: 'We hold ourselves to the highest standards in everything we build and every interaction.'
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: 'Integrity',
      description: 'We operate with complete transparency and always do what\'s right for our users.'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Diversity',
      description: 'We celebrate and amplify diverse voices, stories, and perspectives in entertainment.'
    }
  ]

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '1M+', label: 'Submissions' },
    { number: '5K+', label: 'Productions' },
    { number: '98%', label: 'Satisfaction' }
  ]

  const timeline = [
    {
      year: '2020',
      title: 'The Beginning',
      description: 'Founded by industry veterans frustrated with outdated casting methods.'
    },
    {
      year: '2021',
      title: 'Product Launch',
      description: 'Launched our MVP with 100 beta users in Los Angeles and New York.'
    },
    {
      year: '2022',
      title: 'Rapid Growth',
      description: 'Expanded nationwide, reached 10,000 users, and secured Series A funding.'
    },
    {
      year: '2023',
      title: 'Going Global',
      description: 'International expansion to UK, Canada, and Australia. Mobile apps launched.'
    },
    {
      year: '2024',
      title: 'Industry Leader',
      description: 'Became the #1 casting platform with 50,000+ active users worldwide.'
    }
  ]

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former casting director with 15 years in film and television.',
      image: '👩‍💼'
    },
    {
      name: 'Marcus Johnson',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Netflix engineer passionate about democratizing entertainment.',
      image: '👨‍💻'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Head of Product',
      bio: 'Product leader with deep experience in creator economy platforms.',
      image: '👩‍🎨'
    },
    {
      name: 'David Kim',
      role: 'Head of Community',
      bio: 'Former talent agent dedicated to supporting emerging artists.',
      image: '👨‍🎤'
    }
  ]

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
              <Link href="/features" className="text-gray-700 hover:text-primary-600">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-primary-600">
                Pricing
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
            Empowering the
            <span className="gradient-text"> Entertainment Industry</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            We're on a mission to democratize casting and create opportunities 
            for talent everywhere to showcase their abilities and connect with amazing projects.
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container-mobile max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-heading font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                Castingly was born from a simple observation: the casting process was stuck in the past. 
                While other industries embraced digital transformation, casting still relied on outdated 
                methods that wasted time and missed opportunities.
              </p>
              <p className="text-gray-600 mb-4">
                We saw talented actors struggling to get seen, agents drowning in paperwork, and casting 
                directors spending more time on logistics than discovering great talent.
              </p>
              <p className="text-gray-600">
                So we built Castingly - a platform that works the way professionals actually work: 
                on the go, collaboratively, and with powerful tools that make decisions easier, not harder.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-2xl font-heading font-bold text-primary-700">
                    Transforming<br />Casting
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4">
        <div className="container-mobile">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Our Values</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4 text-primary-600">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container-mobile">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-white">
            Our Impact
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-white/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container-mobile max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">Our Journey</h2>
          
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    <span className="font-bold text-primary-700">{item.year}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="container-mobile">
          <h2 className="text-3xl font-heading font-bold text-center mb-4">Meet the Team</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Built by industry professionals who understand the unique challenges of entertainment.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
                  {member.image}
                </div>
                <h3 className="font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-primary-600 mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container-mobile text-center">
          <h2 className="text-3xl font-heading font-bold mb-6 text-white">
            Join Us in Transforming Entertainment
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Whether you're an actor, agent, or casting director, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="btn-touch bg-white text-primary-600 hover:bg-gray-100 text-lg px-8"
            >
              Get Started Free
            </Link>
            <Link 
              href="/contact"
              className="btn-touch border-2 border-white text-white hover:bg-white/10 text-lg px-8"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}