'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Upload,
  Video,
  Image,
  FileText,
  Music,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  Star,
  Grid,
  List,
  Filter,
  Search,
  Check,
  X,
  Play,
  Pause,
  Volume2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useAuthStore from '@/lib/store/auth-store'

// Mock media data
const mediaItems = [
  {
    id: '1',
    type: 'video',
    category: 'Self-Tape',
    title: 'Dramatic Monologue - Hamlet',
    thumbnail: 'https://placehold.co/400x225/e8d5f2/9c27b0?text=Video',
    duration: '2:45',
    size: '124 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 2),
    featured: true,
    views: 45,
    tags: ['Drama', 'Shakespeare', 'Classical']
  },
  {
    id: '2',
    type: 'image',
    category: 'Headshot',
    title: 'Professional Headshot - Main',
    thumbnail: 'https://placehold.co/400x500/e8d5f2/9c27b0?text=Headshot',
    size: '2.4 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 5),
    featured: true,
    views: 127,
    tags: ['Professional', 'Color', 'Current']
  },
  {
    id: '3',
    type: 'video',
    category: 'Reel',
    title: 'Acting Reel 2024',
    thumbnail: 'https://placehold.co/400x225/e8d5f2/9c27b0?text=Reel',
    duration: '3:30',
    size: '256 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 10),
    featured: true,
    views: 89,
    tags: ['Reel', 'Drama', 'Comedy', 'Action']
  },
  {
    id: '4',
    type: 'image',
    category: 'Headshot',
    title: 'Commercial Headshot',
    thumbnail: 'https://placehold.co/400x500/e8d5f2/9c27b0?text=Commercial',
    size: '1.8 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 7),
    featured: false,
    views: 34,
    tags: ['Commercial', 'Casual', 'Friendly']
  },
  {
    id: '5',
    type: 'document',
    category: 'Resume',
    title: 'Acting Resume - Updated',
    thumbnail: 'https://placehold.co/400x500/f5f5f5/666?text=Resume',
    size: '245 KB',
    uploadedAt: new Date(Date.now() - 86400000),
    featured: false,
    views: 67,
    tags: ['Resume', 'Current']
  },
  {
    id: '6',
    type: 'video',
    category: 'Self-Tape',
    title: 'Comedy Scene - The Office',
    thumbnail: 'https://placehold.co/400x225/e8d5f2/9c27b0?text=Comedy',
    duration: '1:55',
    size: '98 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 3),
    featured: false,
    views: 23,
    tags: ['Comedy', 'Sitcom', 'Improv']
  },
  {
    id: '7',
    type: 'audio',
    category: 'Voice Over',
    title: 'Commercial VO Demo',
    thumbnail: 'https://placehold.co/400x400/f5f5f5/666?text=Audio',
    duration: '1:30',
    size: '12 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 15),
    featured: false,
    views: 12,
    tags: ['Voice Over', 'Commercial', 'Narration']
  },
  {
    id: '8',
    type: 'image',
    category: 'Headshot',
    title: 'Theatrical Headshot B&W',
    thumbnail: 'https://placehold.co/400x500/333/fff?text=B%26W',
    size: '2.1 MB',
    uploadedAt: new Date(Date.now() - 86400000 * 20),
    featured: false,
    views: 45,
    tags: ['Theatrical', 'Black & White', 'Dramatic']
  }
]

const categories = ['All', 'Headshot', 'Self-Tape', 'Reel', 'Resume', 'Voice Over']

export default function ActorMedia() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<any>(null)
  
  const filteredMedia = mediaItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })
  
  const stats = {
    total: mediaItems.length,
    videos: mediaItems.filter(m => m.type === 'video').length,
    images: mediaItems.filter(m => m.type === 'image').length,
    documents: mediaItems.filter(m => m.type === 'document').length,
    totalViews: mediaItems.reduce((sum, item) => sum + item.views, 0)
  }
  
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'image': return <Image className="w-4 h-4" />
      case 'document': return <FileText className="w-4 h-4" />
      case 'audio': return <Music className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }
  
  const handleUpload = () => {
    setIsUploading(true)
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false)
    }, 2000)
  }
  
  const handleDelete = (itemId: string) => {
    // Handle delete
    console.log('Delete item:', itemId)
  }
  
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Media Library"
        subtitle="Manage your photos, videos, and documents"
        actions={
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <>
                <Badge variant="secondary" className="py-2">
                  {selectedItems.length} selected
                </Badge>
                <Button
                  onClick={() => setSelectedItems([])}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
                <Button
                  onClick={() => handleDelete(selectedItems[0])}
                  variant="error"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button
              onClick={handleUpload}
              variant="default"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Media'}
            </Button>
          </div>
        }
      />
      
      <PageContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Files</p>
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
                  <p className="text-sm text-gray-600">Videos</p>
                  <p className="text-2xl font-bold">{stats.videos}</p>
                </div>
                <Video className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Photos</p>
                  <p className="text-2xl font-bold">{stats.images}</p>
                </div>
                <Image className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documents</p>
                  <p className="text-2xl font-bold">{stats.documents}</p>
                </div>
                <FileText className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search media by name or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(category => {
            const count = category === 'All' 
              ? mediaItems.length 
              : mediaItems.filter(m => m.category === category).length
            
            return (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
              >
                {category} ({count})
              </Button>
            )
          })}
        </div>
        
        {/* Media Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-lg transition-all cursor-pointer ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-primary-500' : ''
                }`}>
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90">
                        {getTypeIcon(item.type)}
                      </Badge>
                    </div>
                    
                    {/* Featured Star */}
                    {item.featured && (
                      <div className="absolute top-2 right-2">
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      </div>
                    )}
                    
                    {/* Duration/Size */}
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white">
                        {item.duration || item.size}
                      </Badge>
                    </div>
                    
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelection(item.id)
                        }}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          selectedItems.includes(item.id)
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {selectedItems.includes(item.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                    
                    {/* Play Button for Videos */}
                    {item.type === 'video' && (
                      <div 
                        onClick={() => setPreviewItem(item)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30"
                      >
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-900 ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.category} • {item.uploadedAt.toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" />
                        {item.views}
                      </div>
                      <div className="flex gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Download className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-50 rounded text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMedia.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-all ${
                  selectedItems.includes(item.id) ? 'ring-2 ring-primary-500' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSelection(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedItems.includes(item.id)
                            ? 'bg-primary-500 border-primary-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {selectedItems.includes(item.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{item.title}</h4>
                              {item.featured && (
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                {getTypeIcon(item.type)}
                                {item.category}
                              </span>
                              <span>{item.duration || item.size}</span>
                              <span>{item.uploadedAt.toLocaleDateString()}</span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.views} views
                              </span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="outline" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {item.type === 'video' && (
                              <Button
                                onClick={() => setPreviewItem(item)}
                                variant="ghost"
                                size="sm"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(item.id)}
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No media found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your filters'
                : 'Upload your first media file to get started'}
            </p>
            <Button onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        )}
      </PageContent>
    </AppLayout>
  )
}