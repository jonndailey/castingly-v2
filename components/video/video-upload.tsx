'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Link, 
  Video, 
  X, 
  Check, 
  AlertCircle,
  Film,
  Youtube,
  FileVideo
} from 'lucide-react'
import { cn, formatFileSize, formatDuration, getYouTubeId, getVimeoId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface VideoUploadProps {
  onVideoSelect: (video: VideoFile | VideoLink) => void
  maxSize?: number // in MB
  maxDuration?: number // in seconds
  acceptedFormats?: string[]
}

export interface VideoFile {
  type: 'file'
  file: File
  preview: string
  duration?: number
}

export interface VideoLink {
  type: 'link'
  url: string
  platform: 'youtube' | 'vimeo' | 'other'
  thumbnail?: string
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onVideoSelect,
  maxSize = 500, // 500MB default
  maxDuration = 300, // 5 minutes default
  acceptedFormats = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
}) => {
  const [mode, setMode] = useState<'upload' | 'link'>('upload')
  const [videoUrl, setVideoUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<VideoFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }
    
    setIsProcessing(true)
    
    // Create preview
    const preview = URL.createObjectURL(file)
    
    // Get video duration
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      
      if (video.duration > maxDuration) {
        alert(`Video must be less than ${formatDuration(maxDuration)}`)
        setIsProcessing(false)
        return
      }
      
      const videoFile: VideoFile = {
        type: 'file',
        file,
        preview,
        duration: video.duration
      }
      
      setUploadedFile(videoFile)
      setIsProcessing(false)
    }
    video.src = preview
  }, [maxSize, maxDuration])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': acceptedFormats.map(format => `.${format.split('/')[1]}`)
    },
    maxFiles: 1,
    disabled: isProcessing
  })
  
  const handleLinkSubmit = () => {
    setUrlError('')
    
    if (!videoUrl) {
      setUrlError('Please enter a video URL')
      return
    }
    
    let platform: 'youtube' | 'vimeo' | 'other' = 'other'
    let thumbnail: string | undefined
    
    const youtubeId = getYouTubeId(videoUrl)
    const vimeoId = getVimeoId(videoUrl)
    
    if (youtubeId) {
      platform = 'youtube'
      thumbnail = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    } else if (vimeoId) {
      platform = 'vimeo'
      // Vimeo thumbnails require API call
    }
    
    const videoLink: VideoLink = {
      type: 'link',
      url: videoUrl,
      platform,
      thumbnail
    }
    
    onVideoSelect(videoLink)
  }
  
  const handleUploadSubmit = () => {
    if (uploadedFile) {
      onVideoSelect(uploadedFile)
    }
  }
  
  return (
    <div className="w-full">
      {/* Mode selector */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setMode('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors',
            mode === 'upload'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
        <button
          onClick={() => setMode('link')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors',
            mode === 'link'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Link className="w-4 h-4" />
          Link Video
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {mode === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!uploadedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400',
                  isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <FileVideo className="w-8 h-8 text-primary-600" />
                  </div>
                  
                  {isDragActive ? (
                    <p className="text-lg font-medium text-primary-600">
                      Drop the video here
                    </p>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        Drag & drop your video here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        or click to browse files
                      </p>
                    </>
                  )}
                  
                  <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
                    <Badge variant="outline">Max {maxSize}MB</Badge>
                    <Badge variant="outline">Max {formatDuration(maxDuration)}</Badge>
                    <Badge variant="outline">MP4, MOV, AVI</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-green-500 bg-green-50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                    <video
                      src={uploadedFile.preview}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatFileSize(uploadedFile.file.size)}
                          {uploadedFile.duration && (
                            <> • {formatDuration(uploadedFile.duration)}</>
                          )}
                        </p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedFile(null)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Video ready to submit
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleUploadSubmit}
                  className="w-full mt-4"
                  size="lg"
                >
                  Use This Video
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="link"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                error={urlError}
                icon={<Link className="w-4 h-4" />}
              />
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Supported:</span>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </div>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vimeo
                </div>
              </div>
              
              <Button
                onClick={handleLinkSubmit}
                className="w-full"
                size="lg"
                disabled={!videoUrl}
              >
                Add Video Link
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm text-blue-700">Processing video...</span>
        </div>
      )}
    </div>
  )
}

export default VideoUpload