'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building,
  Edit2,
  Download,
  Eye,
  MessageCircle,
  Star,
  TrendingUp,
  Award,
  Briefcase,
  Users,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  Archive,
  AlertTriangle,
  CheckSquare
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock contracts data
const contracts = [
  {
    id: 'contract1',
    talent: {
      id: 'actor1',
      name: 'Marcus Johnson',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=MJ'
    },
    project: {
      title: 'Shadow Protocol - Season 1',
      studio: 'Netflix',
      type: 'TV Series',
      logo: 'https://placehold.co/40x40/e50914/ffffff?text=N'
    },
    contractType: 'Series Regular',
    status: 'active',
    signedDate: new Date('2024-02-15'),
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-12-31'),
    value: '$1,200,000',
    commission: '$180,000',
    commissionRate: 15,
    episodes: 8,
    episodeFee: '$150,000',
    options: {
      season2: { status: 'pending', fee: '$175,000' },
      season3: { status: 'unexercised', fee: '$200,000' }
    },
    terms: {
      exclusivity: true,
      merchandising: 'Included',
      backend: '2% of net profits',
      promotion: 'Required',
      travel: 'First class provided'
    },
    paymentSchedule: [
      { milestone: 'Signing', amount: '$300,000', status: 'paid', date: new Date('2024-02-20') },
      { milestone: 'Start of Production', amount: '$300,000', status: 'paid', date: new Date('2024-06-01') },
      { milestone: 'Completion 50%', amount: '$300,000', status: 'pending', date: new Date('2024-09-15') },
      { milestone: 'Final Delivery', amount: '$300,000', status: 'upcoming', date: new Date('2024-12-31') }
    ],
    documents: [
      { name: 'Main Agreement', type: 'PDF', size: '2.4 MB', uploaded: new Date('2024-02-15') },
      { name: 'Schedule A - Compensation', type: 'PDF', size: '1.2 MB', uploaded: new Date('2024-02-15') },
      { name: 'Rider - Special Provisions', type: 'PDF', size: '0.8 MB', uploaded: new Date('2024-02-16') }
    ],
    priority: 'high'
  },
  {
    id: 'contract2',
    talent: {
      id: 'actor2',
      name: 'Maya Patel',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=MP'
    },
    project: {
      title: 'Marvel Studios Feature Film',
      studio: 'Marvel Studios / Disney',
      type: 'Film',
      logo: 'https://placehold.co/40x40/ed1d24/ffffff?text=M'
    },
    contractType: 'Supporting Lead',
    status: 'negotiating',
    signedDate: null,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-02-28'),
    value: '$2,500,000',
    commission: '$375,000',
    commissionRate: 15,
    episodes: null,
    episodeFee: null,
    options: {
      sequel: { status: 'included', fee: '$3,500,000' },
      merchandise: { status: 'negotiating', percentage: '5%' }
    },
    terms: {
      exclusivity: true,
      merchandising: 'Negotiating',
      backend: 'TBD',
      promotion: 'Extensive campaign required',
      travel: 'First class + per diem'
    },
    paymentSchedule: [
      { milestone: 'Signing', amount: '$500,000', status: 'pending', date: null },
      { milestone: 'Start of Principal Photography', amount: '$750,000', status: 'upcoming', date: new Date('2024-09-01') },
      { milestone: 'Completion of Principal Photography', amount: '$750,000', status: 'upcoming', date: new Date('2025-01-15') },
      { milestone: 'Final Delivery', amount: '$500,000', status: 'upcoming', date: new Date('2025-02-28') }
    ],
    documents: [
      { name: 'Draft Agreement v3', type: 'PDF', size: '3.2 MB', uploaded: new Date('2024-03-10') },
      { name: 'Negotiation Notes', type: 'DOC', size: '0.5 MB', uploaded: new Date('2024-03-12') }
    ],
    priority: 'urgent'
  },
  {
    id: 'contract3',
    talent: {
      id: 'actor3',
      name: 'Elena Rodriguez',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=ER'
    },
    project: {
      title: 'Broadway Revival - Hamilton',
      studio: 'Broadway Production Group',
      type: 'Theater',
      logo: 'https://placehold.co/40x40/ffd700/000000?text=B'
    },
    contractType: 'Lead Role',
    status: 'completed',
    signedDate: new Date('2023-11-01'),
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-08-31'),
    value: '$780,000',
    commission: '$117,000',
    commissionRate: 15,
    episodes: null,
    episodeFee: null,
    options: {
      tour: { status: 'exercised', fee: '$15,000/week' },
      extension: { status: 'declined', fee: '$18,000/week' }
    },
    terms: {
      exclusivity: false,
      merchandising: 'Standard Broadway terms',
      backend: 'None',
      promotion: 'Standard Broadway promotion',
      travel: 'N/A'
    },
    paymentSchedule: [
      { milestone: 'Weekly Pay (26 weeks)', amount: '$780,000', status: 'completed', date: new Date('2024-08-31') }
    ],
    documents: [
      { name: 'AEA Standard Contract', type: 'PDF', size: '1.8 MB', uploaded: new Date('2023-11-01') },
      { name: 'Tour Agreement', type: 'PDF', size: '1.1 MB', uploaded: new Date('2024-07-15') }
    ],
    priority: 'low'
  },
  {
    id: 'contract4',
    talent: {
      id: 'actor4',
      name: 'Sarah Williams',
      avatar: 'https://placehold.co/50x50/e8d5f2/9c27b0?text=SW'
    },
    project: {
      title: 'Apple iPhone Campaign',
      studio: 'Apple Inc.',
      type: 'Commercial',
      logo: 'https://placehold.co/40x40/007aff/ffffff?text=A'
    },
    contractType: 'National Spokesperson',
    status: 'pending_signature',
    signedDate: null,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2026-03-31'),
    value: '$1,200,000',
    commission: '$180,000',
    commissionRate: 15,
    episodes: null,
    episodeFee: null,
    options: {
      renewal: { status: 'included', fee: '$1,500,000' },
      international: { status: 'negotiating', bonus: '$300,000' }
    },
    terms: {
      exclusivity: 'Tech category only',
      merchandising: 'Limited usage rights',
      backend: 'Usage fees additional',
      promotion: 'Global campaign participation',
      travel: 'As needed, first class'
    },
    paymentSchedule: [
      { milestone: 'Signing Bonus', amount: '$300,000', status: 'pending', date: null },
      { milestone: 'Year 1 Completion', amount: '$450,000', status: 'upcoming', date: new Date('2025-03-31') },
      { milestone: 'Year 2 Completion', amount: '$450,000', status: 'upcoming', date: new Date('2026-03-31') }
    ],
    documents: [
      { name: 'Final Contract Agreement', type: 'PDF', size: '2.8 MB', uploaded: new Date('2024-03-20') },
      { name: 'Usage Rights Addendum', type: 'PDF', size: '1.5 MB', uploaded: new Date('2024-03-20') }
    ],
    priority: 'high'
  }
]

const statusConfig = {
  active: {
    label: 'Active',
    color: 'success',
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Contract in progress'
  },
  negotiating: {
    label: 'Negotiating',
    color: 'warning',
    icon: <RefreshCw className="w-4 h-4" />,
    description: 'Terms being negotiated'
  },
  pending_signature: {
    label: 'Pending Signature',
    color: 'warning',
    icon: <Clock className="w-4 h-4" />,
    description: 'Awaiting signature'
  },
  completed: {
    label: 'Completed',
    color: 'secondary',
    icon: <CheckSquare className="w-4 h-4" />,
    description: 'Contract fulfilled'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Contract cancelled'
  }
}

const filterOptions = {
  status: ['All', 'Active', 'Negotiating', 'Pending Signature', 'Completed', 'Cancelled'],
  type: ['All', 'Film', 'TV Series', 'Theater', 'Commercial', 'Voice Over'],
  talent: ['All', ...Array.from(new Set(contracts.map(c => c.talent.name)))],
  priority: ['All', 'Urgent', 'High', 'Medium', 'Low']
}

export default function AgentContracts() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'All',
    type: 'All',
    talent: 'All',
    priority: 'All'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('value')
  
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.talent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contract.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          contract.project.studio.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedFilters.status === 'All' || contract.status === selectedFilters.status.toLowerCase().replace(' ', '_')
    const matchesType = selectedFilters.type === 'All' || contract.project.type === selectedFilters.type
    const matchesTalent = selectedFilters.talent === 'All' || contract.talent.name === selectedFilters.talent
    const matchesPriority = selectedFilters.priority === 'All' || contract.priority === selectedFilters.priority.toLowerCase()
    
    return matchesSearch && matchesStatus && matchesType && matchesTalent && matchesPriority
  })
  
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    switch(sortBy) {
      case 'value':
        return parseFloat(b.value.replace(/[$,]/g, '')) - parseFloat(a.value.replace(/[$,]/g, ''))
      case 'commission':
        return parseFloat(b.commission.replace(/[$,]/g, '')) - parseFloat(a.commission.replace(/[$,]/g, ''))
      case 'startDate':
        return b.startDate.getTime() - a.startDate.getTime()
      default:
        return b.startDate.getTime() - a.startDate.getTime()
    }
  })
  
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    negotiating: contracts.filter(c => c.status === 'negotiating').length,
    totalValue: contracts.reduce((sum, c) => sum + parseFloat(c.value.replace(/[$,]/g, '')), 0),
    totalCommission: contracts.reduce((sum, c) => sum + parseFloat(c.commission.replace(/[$,]/g, '')), 0),
    pendingPayments: contracts.reduce((sum, c) => {
      return sum + c.paymentSchedule.filter(p => p.status === 'pending').reduce((pSum, p) => pSum + parseFloat(p.amount.replace(/[$,]/g, '')), 0)
    }, 0)
  }
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const getPaymentStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'upcoming': return 'secondary'
      case 'overdue': return 'error'
      default: return 'secondary'
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Contracts & Deals"
        subtitle="Manage talent contracts, payments, and negotiations"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Contract
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contracts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Negotiating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.negotiating}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-blue-600">${(stats.totalValue / 1000000).toFixed(1)}M</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commission</p>
                  <p className="text-2xl font-bold text-green-600">${(stats.totalCommission / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-600">${(stats.pendingPayments / 1000).toFixed(0)}K</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search contracts by talent, project, or studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="value">Highest Value</option>
              <option value="commission">Highest Commission</option>
              <option value="startDate">Recent Start Date</option>
            </select>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(filterOptions).map(([key, options]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key}
                      </label>
                      <select
                        value={selectedFilters[key as keyof typeof selectedFilters]}
                        onChange={(e) => setSelectedFilters({
                          ...selectedFilters,
                          [key]: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      >
                        {options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={() => setSelectedFilters({
                      status: 'All',
                      type: 'All',
                      talent: 'All',
                      priority: 'All'
                    })}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    size="sm"
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Contracts List */}
        <div className="space-y-6">
          {sortedContracts.map((contract, index) => {
            const status = statusConfig[contract.status as keyof typeof statusConfig]
            const paidPayments = contract.paymentSchedule.filter(p => p.status === 'paid').length
            const totalPayments = contract.paymentSchedule.length
            
            return (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            {/* Talent & Studio */}
                            <div className="flex items-center gap-3">
                              <Avatar className="w-16 h-16">
                                <img 
                                  src={contract.talent.avatar} 
                                  alt={contract.talent.name}
                                  className="w-full h-full object-cover"
                                />
                              </Avatar>
                              <img 
                                src={contract.project.logo} 
                                alt={contract.project.studio}
                                className="w-12 h-12 rounded-lg"
                              />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={status.color as any}
                                  className="flex items-center gap-1"
                                >
                                  {status.icon}
                                  {status.label}
                                </Badge>
                                <Badge 
                                  className={`${getPriorityColor(contract.priority)} border-0`}
                                  size="sm"
                                >
                                  {contract.priority.toUpperCase()}
                                </Badge>
                              </div>
                              <h3 className="text-xl font-heading font-semibold">
                                {contract.talent.name}
                              </h3>
                              <p className="text-gray-600 mb-1">
                                {contract.project.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contract.contractType} • {contract.project.studio}
                              </p>
                            </div>
                          </div>
                          
                          {/* Value Display */}
                          <div className="text-right">
                            <div className="mb-2">
                              <p className="text-sm text-gray-500">Contract Value</p>
                              <p className="text-2xl font-bold text-blue-600">{contract.value}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Your Commission</p>
                              <p className="text-lg font-bold text-green-600">{contract.commission}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contract Timeline */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Start Date</p>
                              <p className="font-medium">{contract.startDate.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">End Date</p>
                              <p className="font-medium">{contract.endDate.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Commission Rate</p>
                              <p className="font-medium">{contract.commissionRate}%</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Payment Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">Payment Progress</p>
                            <p className="text-sm text-gray-600">{paidPayments}/{totalPayments} payments completed</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(paidPayments / totalPayments) * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Key Terms */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Exclusivity</p>
                            <Badge variant="outline" size="sm">
                              {contract.terms.exclusivity ? 'Exclusive' : 'Non-exclusive'}
                            </Badge>
                          </div>
                          {contract.episodes && (
                            <div>
                              <p className="text-xs text-gray-500">Episodes</p>
                              <Badge variant="outline" size="sm">
                                {contract.episodes} episodes
                              </Badge>
                            </div>
                          )}
                          {contract.terms.backend !== 'None' && (
                            <div>
                              <p className="text-xs text-gray-500">Backend</p>
                              <Badge variant="outline" size="sm">
                                {contract.terms.backend}
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Options */}
                        {Object.keys(contract.options).length > 0 && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Contract Options</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(contract.options).map(([key, option]) => (
                                <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                  <div>
                                    <p className="text-xs font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        variant={
                                          option.status === 'exercised' ? 'success' : 
                                          option.status === 'pending' ? 'warning' : 'secondary'
                                        } 
                                        size="sm"
                                      >
                                        {option.status}
                                      </Badge>
                                      {option.fee && (
                                        <span className="text-xs text-gray-600">{option.fee}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions Sidebar */}
                      <div className="lg:w-64 space-y-3">
                        {/* Quick Stats */}
                        <Card className="bg-gray-50">
                          <CardContent className="p-3">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Documents:</span>
                                <span className="font-medium">{contract.documents.length}</span>
                              </div>
                              {contract.signedDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Signed:</span>
                                  <span className="font-medium">{contract.signedDate.toLocaleDateString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Days Remaining:</span>
                                <span className="font-medium">
                                  {Math.ceil((contract.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            onClick={() => router.push(`/agent/contracts/${contract.id}`)}
                            variant="default"
                            size="sm"
                            className="w-full"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {contract.status === 'negotiating' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Terms
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Docs
                          </Button>
                          
                          <Button
                            onClick={() => router.push(`/agent/roster/${contract.talent.id}`)}
                            variant="ghost"
                            size="sm"
                            className="w-full"
                          >
                            <User className="w-4 h-4 mr-2" />
                            View Talent
                          </Button>
                        </div>
                        
                        {/* Status-specific Actions */}
                        {contract.status === 'pending_signature' && (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-xs font-medium text-yellow-700 mb-2">Action Required</p>
                            <p className="text-sm text-yellow-800 mb-2">Contract awaiting signature</p>
                            <Button variant="warning" size="sm" className="w-full">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Send Reminder
                            </Button>
                          </div>
                        )}
                        
                        {contract.status === 'negotiating' && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-2">In Negotiation</p>
                            <p className="text-sm text-blue-800 mb-2">Terms being finalized</p>
                            <Button variant="default" size="sm" className="w-full">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Contact Studio
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        
        {/* Empty State */}
        {sortedContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No contracts found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedFilters({
                  status: 'All',
                  type: 'All',
                  talent: 'All',
                  priority: 'All'
                })
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}