'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileImage, 
  Video, 
  File,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  User,
  Calendar,
  Tag,
  HardDrive,
  MoreVertical,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface MediaFile {
  id: number
  type: 'actor_media' | 'submission_media'
  media_type: string
  media_url: string
  caption?: string
  is_primary?: boolean
  owner_name: string
  owner_email: string
  owner_id: number
  created_at: string
  file_size?: string
  file_type?: string
}

interface MediaStats {
  totalFiles: number
  totalSize: string
  actorMedia: number
  submissionMedia: number
  headshots: number
  videos: number
  reels: number
  resumes: number
  recentUploads: number
}

export default function MediaManagementPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [stats, setStats] = useState<MediaStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])

  useEffect(() => {
    fetchMediaFiles()
    fetchStats()
  }, [currentPage, searchTerm, typeFilter, mediaTypeFilter])

  const fetchMediaFiles = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        type: typeFilter === 'all' ? '' : typeFilter,
        media_type: mediaTypeFilter === 'all' ? '' : mediaTypeFilter,
      })

      const response = await fetch(`/api/admin/media?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.files)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch media files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/media/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch media stats:', error)
    }
  }

  const deleteMediaFile = async (fileId: number) => {
    try {
      const response = await fetch(`/api/admin/media/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchMediaFiles()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to delete media file:', error)
    }
  }

  const bulkDeleteFiles = async () => {
    if (selectedFiles.length === 0) return
    
    try {
      const response = await fetch('/api/admin/media/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      })

      if (response.ok) {
        setSelectedFiles([])
        fetchMediaFiles()
        fetchStats()
      }
    } catch (error) {
      console.error('Failed to bulk delete files:', error)
    }
  }

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'headshot':
      case 'gallery':
        return <FileImage className="w-5 h-5 text-purple-500" />
      case 'reel':
      case 'audition_video':
        return <Video className="w-5 h-5 text-blue-500" />
      case 'resume':
        return <File className="w-5 h-5 text-green-500" />
      default:
        return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case 'headshot':
        return 'bg-purple-100 text-purple-800'
      case 'gallery':
        return 'bg-pink-100 text-pink-800'
      case 'reel':
      case 'audition_video':
        return 'bg-blue-100 text-blue-800'
      case 'resume':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  }

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(url)
  }

  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Management</h1>
          <p className="text-gray-600">Manage uploaded images, videos, and files</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Files</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFiles.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{stats.totalSize}</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Actor Media</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.actorMedia.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Headshots, reels, resumes</p>
                  </div>
                  <FileImage className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Submission Videos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.submissionMedia.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Audition videos</p>
                  </div>
                  <Video className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentUploads.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Last 7 days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by owner name, email, or caption..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">All Sources</option>
                  <option value="actor_media">Actor Media</option>
                  <option value="submission_media">Submission Media</option>
                </select>

                <select
                  value={mediaTypeFilter}
                  onChange={(e) => setMediaTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="headshot">Headshots</option>
                  <option value="reel">Reels</option>
                  <option value="gallery">Gallery</option>
                  <option value="resume">Resumes</option>
                  <option value="audition_video">Audition Videos</option>
                </select>

                {selectedFiles.length > 0 && (
                  <Button
                    onClick={bulkDeleteFiles}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedFiles.length})
                  </Button>
                )}

                <Button
                  onClick={() => {
                    fetchMediaFiles()
                    fetchStats()
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Files Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Media Files ({mediaFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mediaFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                  >
                    {/* File Preview */}
                    <div className="aspect-video bg-gray-100 relative">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="absolute top-2 left-2 z-10"
                      />
                      
                      {file.is_primary && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}

                      {isImage(file.media_url) ? (
                        <img
                          src={file.media_url}
                          alt={file.caption || 'Media file'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><FileImage class="w-12 h-12 text-gray-400" /></div>'
                          }}
                        />
                      ) : isVideo(file.media_url) ? (
                        <div className="flex items-center justify-center h-full bg-gray-200">
                          <Video className="w-12 h-12 text-gray-400" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-200">
                          <File className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMediaTypeColor(file.media_type)}`}>
                          {file.media_type}
                        </span>
                        {getMediaTypeIcon(file.media_type)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-3 h-3 mr-1" />
                          <span className="truncate">{file.owner_name}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatDate(file.created_at)}</span>
                        </div>

                        {file.caption && (
                          <p className="text-sm text-gray-700 truncate" title={file.caption}>
                            {file.caption}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                          <a
                            href={file.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a
                            href={file.media_url}
                            download
                            className="p-1 text-gray-500 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                        <button
                          onClick={() => deleteMediaFile(file.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {mediaFiles.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No media files found</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}