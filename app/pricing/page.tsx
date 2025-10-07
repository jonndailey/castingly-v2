'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Actor',
      description: 'Perfect for individual performers',
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: [
        { name: 'Unlimited submissions', included: true },
        { name: 'Professional profile', included: true },
        { name: 'Video hosting (5GB)', included: true },
        { name: 'Real-time notifications', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'Agent representation tools', included: false },
        { name: 'Bulk submissions', included: false },
        { name: 'Team collaboration', included: false },
        { name: 'Custom workflows', included: false },
        { name: 'API access', included: false },
      ],
      cta: 'Start Free Trial',
      href: '/register?plan=actor',
      popular: false
    },
    {
      name: 'Agent',
      description: 'For talent representatives',
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        { name: 'Everything in Actor plan', included: true },
        { name: 'Up to 50 client profiles', included: true },
        { name: 'Agent representation tools', included: true },
        { name: 'Bulk submissions', included: true },
        { name: 'Commission tracking', included: true },
        { name: 'Video hosting (50GB)', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Priority support', included: true },
        { name: 'Client portal access', included: true },
        { name: 'Team collaboration', included: false },
        { name: 'Custom workflows', included: false },
        { name: 'API access', included: false },
      ],
      cta: 'Start Free Trial',
      href: '/register?plan=agent',
      popular: true
    },
    {
      name: 'Casting Director',
      description: 'For casting professionals',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        { name: 'Unlimited projects', included: true },
        { name: 'Advanced filtering system', included: true },
        { name: 'Team collaboration', included: true },
        { name: 'Video hosting (100GB)', included: true },
        { name: 'Custom workflows', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'Session scheduling', included: true },
        { name: 'Export tools', included: true },
        { name: 'Multi-user accounts', included: true },
        { name: 'SSO authentication', included: true },
        { name: 'API access', included: true },
        { name: 'Custom integrations', included: true },
      ],
      cta: 'Start Free Trial',
      href: '/register?plan=casting',
      popular: false
    }
  ]

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and ACH bank transfers for enterprise accounts.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all plans come with a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees.'
    },
    {
      question: 'Do you offer discounts for students?',
      answer: 'Yes! Students and recent graduates can get 50% off any plan with valid student ID.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data remains accessible for 30 days after cancellation. You can export everything before your account is closed.'
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
            Simple, Transparent 
            <span className="gradient-text"> Pricing</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-lg"
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === 'yearly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container-mobile">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative bg-white rounded-2xl ${
                  plan.popular ? 'border-2 border-primary-600' : 'border border-gray-200'
                } p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-gray-600">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${(plan.monthlyPrice * 12) - plan.yearlyPrice} per year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`btn-touch w-full text-center ${
                    plan.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Enterprise */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
              <p className="text-gray-600 mb-6">
                Need a custom solution for your studio or production company? 
                We offer flexible plans with unlimited users, custom integrations, and dedicated support.
              </p>
              <Link 
                href="/contact"
                className="inline-flex btn-touch bg-primary-600 text-white hover:bg-primary-700"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-4 bg-white">
        <div className="container-mobile max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container-mobile text-center">
          <h2 className="text-3xl font-heading font-bold mb-6">
            Start Your 14-Day Free Trial
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            No credit card required. Cancel anytime. Get started in less than 60 seconds.
          </p>
          <Link 
            href="/register"
            className="inline-flex btn-touch bg-primary-600 text-white hover:bg-primary-700 text-lg px-8"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}