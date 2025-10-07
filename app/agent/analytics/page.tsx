'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  Award,
  Star,
  Target,
  CheckCircle,
  Clock,
  Send,
  ArrowUp,
  ArrowDown,
  Minus,
  Film,
  Tv,
  Theater,
  Mic,
  Eye,
  RefreshCw,
  FileText
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock analytics data
const analyticsData = {
  overview: {
    totalRevenue: 2750000,
    revenueGrowth: 18.5,
    totalCommission: 412500,
    commissionGrowth: 22.3,
    activeContracts: 12,
    contractsGrowth: 15.4,
    avgDealSize: 875000,
    dealSizeGrowth: 8.7,
    submissionRate: 76,
    bookingRate: 23,
    callbackRate: 45,
    clientRetention: 94
  },
  monthlyRevenue: [
    { month: 'Jan', revenue: 180000, commission: 27000 },
    { month: 'Feb', revenue: 220000, commission: 33000 },
    { month: 'Mar', revenue: 195000, commission: 29250 },
    { month: 'Apr', revenue: 275000, commission: 41250 },
    { month: 'May', revenue: 320000, commission: 48000 },
    { month: 'Jun', revenue: 290000, commission: 43500 },
    { month: 'Jul', revenue: 350000, commission: 52500 },
    { month: 'Aug', revenue: 385000, commission: 57750 },
    { month: 'Sep', revenue: 420000, commission: 63000 },
    { month: 'Oct', revenue: 310000, commission: 46500 },
    { month: 'Nov', revenue: 280000, commission: 42000 },
    { month: 'Dec', revenue: 515000, commission: 77250 }
  ],
  talentPerformance: [
    {
      id: 'actor1',
      name: 'Marcus Johnson',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=MJ',
      revenue: 1200000,
      commission: 180000,
      bookings: 12,
      bookingRate: 85,
      avgDealSize: 100000,
      growth: 25.3
    },
    {
      id: 'actor2',
      name: 'Maya Patel',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=MP',
      revenue: 2500000,
      commission: 375000,
      bookings: 1,
      bookingRate: 90,
      avgDealSize: 2500000,
      growth: 45.8
    },
    {
      id: 'actor3',
      name: 'Elena Rodriguez',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=ER',
      revenue: 780000,
      commission: 117000,
      bookings: 8,
      bookingRate: 65,
      avgDealSize: 97500,
      growth: 12.4
    },
    {
      id: 'actor4',
      name: 'James Thompson',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=JT',
      revenue: 750000,
      commission: 112500,
      bookings: 6,
      bookingRate: 70,
      avgDealSize: 125000,
      growth: -5.2
    },
    {
      id: 'actor5',
      name: 'Sarah Williams',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=SW',
      revenue: 500000,
      commission: 75000,
      bookings: 4,
      bookingRate: 55,
      avgDealSize: 125000,
      growth: 35.7
    },
    {
      id: 'actor6',
      name: 'David Chen',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=DC',
      revenue: 300000,
      commission: 45000,
      bookings: 15,
      bookingRate: 78,
      avgDealSize: 20000,
      growth: 18.9
    }
  ],
  projectTypes: [
    { type: 'Film', count: 18, revenue: 1800000, commission: 270000, avgDeal: 100000 },
    { type: 'TV Series', count: 12, revenue: 2200000, commission: 330000, avgDeal: 183333 },
    { type: 'Commercial', count: 35, revenue: 800000, commission: 120000, avgDeal: 22857 },
    { type: 'Theater', count: 8, revenue: 450000, commission: 67500, avgDeal: 56250 },
    { type: 'Voice Over', count: 15, revenue: 300000, commission: 45000, avgDeal: 20000 }
  ],
  recentDeals: [
    {
      talent: 'Maya Patel',
      project: 'Marvel Studios Feature',
      value: '$2.5M',
      commission: '$375K',
      date: new Date(Date.now() - 86400000 * 2),
      type: 'Film'
    },
    {
      talent: 'Marcus Johnson',
      project: 'Netflix Series Lead',
      value: '$1.2M',
      commission: '$180K',
      date: new Date(Date.now() - 86400000 * 5),
      type: 'TV Series'
    },
    {
      talent: 'Sarah Williams',
      project: 'Apple Campaign',
      value: '$500K',
      commission: '$75K',
      date: new Date(Date.now() - 86400000 * 8),
      type: 'Commercial'
    },
    {
      talent: 'Elena Rodriguez',
      project: 'Broadway Revival',
      value: '$780K',
      commission: '$117K',
      date: new Date(Date.now() - 86400000 * 15),
      type: 'Theater'
    }
  ],
  industryBenchmarks: {
    avgCommissionRate: 15,
    avgBookingRate: 18,
    avgDealSize: 650000,
    clientRetention: 87,
    avgSubmissions: 145
  }
}

const timeRanges = ['This Month', 'Last 3 Months', 'Last 6 Months', 'This Year', 'Last Year']

export default function AgentAnalytics() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Year')
  const [activeTab, setActiveTab] = useState('overview')
  
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-4 h-4 text-green-500" />
    if (growth < 0) return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }
  
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Film': return <Film className="w-4 h-4" />
      case 'TV Series': return <Tv className="w-4 h-4" />
      case 'Commercial': return <Mic className="w-4 h-4" />
      case 'Theater': return <Theater className="w-4 h-4" />
      case 'Voice Over': return <Mic className="w-4 h-4" />
      default: return <Film className="w-4 h-4" />
    }
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'performance', label: 'Talent Performance', icon: <Users className="w-4 h-4" /> },
    { id: 'revenue', label: 'Revenue Analysis', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'benchmarks', label: 'Industry Benchmarks', icon: <Target className="w-4 h-4" /> }
  ]
  
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analyticsData.overview.revenueGrowth)}
                <span className={`text-xs ${getGrowthColor(analyticsData.overview.revenueGrowth)}`}>
                  {Math.abs(analyticsData.overview.revenueGrowth)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ${(analyticsData.overview.totalRevenue / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Commission Earned</p>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analyticsData.overview.commissionGrowth)}
                <span className={`text-xs ${getGrowthColor(analyticsData.overview.commissionGrowth)}`}>
                  {Math.abs(analyticsData.overview.commissionGrowth)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${(analyticsData.overview.totalCommission / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Active Contracts</p>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analyticsData.overview.contractsGrowth)}
                <span className={`text-xs ${getGrowthColor(analyticsData.overview.contractsGrowth)}`}>
                  {Math.abs(analyticsData.overview.contractsGrowth)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {analyticsData.overview.activeContracts}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Deal Size</p>
              <div className="flex items-center gap-1">
                {getGrowthIcon(analyticsData.overview.dealSizeGrowth)}
                <span className={`text-xs ${getGrowthColor(analyticsData.overview.dealSizeGrowth)}`}>
                  {Math.abs(analyticsData.overview.dealSizeGrowth)}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              ${(analyticsData.overview.avgDealSize / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{analyticsData.overview.submissionRate}%</p>
            <p className="text-sm text-gray-600">Submission Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{analyticsData.overview.bookingRate}%</p>
            <p className="text-sm text-gray-600">Booking Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{analyticsData.overview.callbackRate}%</p>
            <p className="text-sm text-gray-600">Callback Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold">{analyticsData.overview.clientRetention}%</p>
            <p className="text-sm text-gray-600">Client Retention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and commission over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Revenue trend chart would appear here</p>
              <p className="text-sm text-gray-500">Interactive chart showing monthly performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Project Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Project Type</CardTitle>
          <CardDescription>Breakdown of earnings across different project categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.projectTypes.map((type) => (
              <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    {getTypeIcon(type.type)}
                  </div>
                  <div>
                    <p className="font-medium">{type.type}</p>
                    <p className="text-sm text-gray-600">{type.count} projects</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${(type.commission / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-gray-600">commission</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Major Deals</CardTitle>
          <CardDescription>Latest high-value contracts closed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.recentDeals.map((deal, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{deal.talent}</p>
                  <p className="text-sm text-gray-600">{deal.project}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" size="sm">
                      {deal.type}
                    </Badge>
                    <span className="text-xs text-gray-500">{deal.date.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{deal.value}</p>
                  <p className="text-sm text-green-600">{deal.commission} commission</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  const renderTalentPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analyticsData.talentPerformance.map((talent) => (
          <Card key={talent.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <img 
                    src={talent.avatar} 
                    alt={talent.name}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                <div>
                  <h3 className="font-medium">{talent.name}</h3>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(talent.growth)}
                    <span className={`text-sm ${getGrowthColor(talent.growth)}`}>
                      {Math.abs(talent.growth)}% growth
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Revenue Generated</span>
                    <span className="font-medium">${(talent.revenue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Your Commission</span>
                    <span className="font-medium text-green-600">${(talent.commission / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{talent.bookings}</p>
                    <p className="text-xs text-gray-600">Bookings</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">{talent.bookingRate}%</p>
                    <p className="text-xs text-gray-600">Success Rate</p>
                  </div>
                </div>
                
                <Button
                  onClick={() => router.push(`/agent/roster/${talent.id}`)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
  
  const renderBenchmarks = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Performance vs Industry</CardTitle>
            <CardDescription>How you compare to industry benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Booking Rate</span>
                  <span>{analyticsData.overview.bookingRate}% vs {analyticsData.industryBenchmarks.avgBookingRate}% avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(analyticsData.overview.bookingRate / 30) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Client Retention</span>
                  <span>{analyticsData.overview.clientRetention}% vs {analyticsData.industryBenchmarks.clientRetention}% avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analyticsData.overview.clientRetention}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Avg Deal Size</span>
                  <span>${(analyticsData.overview.avgDealSize / 1000).toFixed(0)}K vs ${(analyticsData.industryBenchmarks.avgDealSize / 1000).toFixed(0)}K avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(analyticsData.overview.avgDealSize / analyticsData.industryBenchmarks.avgDealSize) * 50}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Ranking</CardTitle>
            <CardDescription>Your standing among peer agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">Top 15%</h3>
              <p className="text-gray-600 mb-4">Performance ranking among CAA agents</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-lg font-bold text-green-600">A+</p>
                  <p className="text-xs text-gray-600">Revenue Grade</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">A</p>
                  <p className="text-xs text-gray-600">Client Satisfaction</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  
  return (
    <AppLayout>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Comprehensive insights into your agency performance"
        actions={
          <div className="flex gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {timeRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="default">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                size="sm"
                className="whitespace-nowrap"
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'performance' && renderTalentPerformance()}
          {activeTab === 'revenue' && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Revenue Analysis</h3>
              <p className="text-gray-600">Detailed revenue breakdowns and projections</p>
            </div>
          )}
          {activeTab === 'benchmarks' && renderBenchmarks()}
        </motion.div>
      </PageContent>
    </AppLayout>
  )
}