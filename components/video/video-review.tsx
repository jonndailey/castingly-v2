'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCw
} from 'lucide-react'
import { cn, formatDuration } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Submission {
  id: string
  actorName: string
  actorImage?: string
  videoUrl: string
  videoPlatform?: 'youtube' | 'vimeo' | 'upload'
  submittedAt: Date
  role: string
  project: string
  notes?: string
  rating?: number
  decision?: 'callback' | 'pass' | 'maybe'
}

interface VideoReviewProps {
  submissions: Submission[]
  onDecision: (submissionId: string, decision: 'callback' | 'pass' | 'maybe') => void
  onRating: (submissionId: string, rating: number) => void
  onNote: (submissionId: string, note: string) => void
}

const VideoReview: React.FC<VideoReviewProps> = ({
  submissions,
  onDecision,
  onRating,
  onNote
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const currentSubmission = submissions[currentIndex]
  
  // Video controls
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('ended', () => setIsPlaying(false))
    
    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [currentIndex])
  
  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, isPlaying])
  
  const togglePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }
  
  const handlePlaybackRateChange = () => {
    const video = videoRef.current
    if (!video) return
    
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentRateIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentRateIndex + 1) % rates.length]
    
    video.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }
  
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  const goToNext = () => {
    if (currentIndex < submissions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }
  
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }
  
  const handleSwipe = (info: PanInfo) => {
    const threshold = 100
    
    if (info.offset.x > threshold) {
      // Swipe right - callback
      handleDecision('callback')
    } else if (info.offset.x < -threshold) {
      // Swipe left - pass
      handleDecision('pass')
    } else if (info.offset.y < -threshold) {
      // Swipe up - maybe
      handleDecision('maybe')
    }
  }
  
  const handleDecision = (decision: 'callback' | 'pass' | 'maybe') => {
    onDecision(currentSubmission.id, decision)
    
    // Auto-advance after decision
    setTimeout(() => {
      if (currentIndex < submissions.length - 1) {
        goToNext()
      }
    }, 500)
  }
  
  const handleRating = (rating: number) => {
    onRating(currentSubmission.id, rating)
  }
  
  const handleNoteSubmit = () => {
    if (noteText.trim()) {
      onNote(currentSubmission.id, noteText)
      setNoteText('')
      setShowNoteInput(false)
    }
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Queue indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {currentIndex + 1} of {submissions.length}
          </Badge>
          <span className="text-sm text-gray-600">
            {currentSubmission.role} • {currentSubmission.project}
          </span>
        </div>
        
        <div className="flex gap-1">
          {submissions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex
                  ? 'bg-primary-600'
                  : index < currentIndex
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Video player */}
      <motion.div
        ref={containerRef}
        className={cn(
          'relative bg-black rounded-xl overflow-hidden',
          isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'
        )}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => handleSwipe(info)}
      >
        {currentSubmission.videoPlatform === 'youtube' ? (
          <iframe
            src={`https://www.youtube.com/embed/${currentSubmission.videoUrl}?rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={currentSubmission.videoUrl}
            className="w-full h-full"
            onClick={togglePlayPause}
          />
        )}
        
        {/* Overlay controls */}
        <AnimatePresence>
          {showControls && !currentSubmission.videoPlatform && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={currentSubmission.actorImage}
                    alt={currentSubmission.actorName}
                    fallback={currentSubmission.actorName}
                    size="sm"
                  />
                  <div>
                    <p className="text-white font-medium">
                      {currentSubmission.actorName}
                    </p>
                    <p className="text-white/70 text-sm">
                      {currentSubmission.role}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleFullscreen}
                  className="text-white/80 hover:text-white"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
              
              {/* Center play button */}
              {!isPlaying && (
                <button
                  onClick={togglePlayPause}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <Play className="w-10 h-10 text-white ml-1" />
                </button>
              )}
              
              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm">
                    {formatDuration(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <span className="text-white text-sm">
                    {formatDuration(duration)}
                  </span>
                </div>
                
                {/* Control buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlayPause}
                      className="text-white/80 hover:text-white"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white/80 hover:text-white"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    
                    <button
                      onClick={handlePlaybackRateChange}
                      className="text-white/80 hover:text-white text-sm font-medium px-2"
                    >
                      {playbackRate}x
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={goToPrevious}
                      disabled={currentIndex === 0}
                      className="text-white/80 hover:text-white disabled:opacity-50"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={currentIndex === submissions.length - 1}
                      className="text-white/80 hover:text-white disabled:opacity-50"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Action buttons */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Button
          onClick={() => handleDecision('pass')}
          variant="outline"
          size="lg"
          className="group"
        >
          <ThumbsDown className="w-5 h-5 mr-2 group-hover:text-red-600" />
          Pass
        </Button>
        
        <Button
          onClick={() => handleDecision('maybe')}
          variant="outline"
          size="lg"
          className="group"
        >
          <RotateCw className="w-5 h-5 mr-2 group-hover:text-yellow-600" />
          Maybe
        </Button>
        
        <Button
          onClick={() => handleDecision('callback')}
          variant="default"
          size="lg"
          className="group"
        >
          <ThumbsUp className="w-5 h-5 mr-2" />
          Callback
        </Button>
      </div>
      
      {/* Rating and notes */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              className={cn(
                'p-1 hover:text-yellow-500 transition-colors',
                currentSubmission.rating && currentSubmission.rating >= rating
                  ? 'text-yellow-500'
                  : 'text-gray-300'
              )}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          ))}
        </div>
        
        <Button
          onClick={() => setShowNoteInput(!showNoteInput)}
          variant="ghost"
          size="sm"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>
      
      {/* Note input */}
      <AnimatePresence>
        {showNoteInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNoteSubmit()}
                placeholder="Add a note about this submission..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                autoFocus
              />
              <Button onClick={handleNoteSubmit} size="sm">
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Swipe hints for mobile */}
      <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500 md:hidden">
        <div className="flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" />
          Swipe left to pass
        </div>
        <div className="flex items-center gap-1">
          Swipe right to callback
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  )
}

export default VideoReview
