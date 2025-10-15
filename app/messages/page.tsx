'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  Plus,
  MessageCircle,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Star,
  Archive,
  Trash2,
  Filter,
  Clock,
  Check,
  CheckCheck,
  Circle,
  Smile,
  Image as ImageIcon,
  FileText
} from 'lucide-react'
import { AppLayout, PageHeader, PageContent } from '@/components/layouts/app-layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import useAuthStore from '@/lib/store/auth-store'

// Mock conversations data
const conversations = [
  {
    id: '1',
    participant: {
      id: 'cd1',
      name: 'Sarah Mitchell',
      role: 'Casting Director',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=SM',
      company: 'Mitchell Casting'
    },
    lastMessage: {
      id: 'm1',
      content: "Hi Alex! I'd love to schedule a callback for the Daniel role. Are you available next Tuesday afternoon?",
      timestamp: new Date(Date.now() - 3600000),
      sender: 'cd1',
      read: false
    },
    unreadCount: 2,
    type: 'callback',
    project: 'Breaking Chains',
    starred: true
  },
  {
    id: '2',
    participant: {
      id: 'cd2',
      name: 'Michael Chen',
      role: 'Casting Director',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=MC',
      company: 'Chen Casting'
    },
    lastMessage: {
      id: 'm2',
      content: "Thanks for the great audition! We'll be in touch soon with next steps.",
      timestamp: new Date(Date.now() - 86400000),
      sender: 'cd2',
      read: true
    },
    unreadCount: 0,
    type: 'feedback',
    project: 'City Lights Season 2',
    starred: false
  },
  {
    id: '3',
    participant: {
      id: 'agent1',
      name: 'Jennifer Martinez',
      role: 'Agent',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=JM',
      company: 'CAA'
    },
    lastMessage: {
      id: 'm3',
      content: "I have three new opportunities for you this week. Let's schedule a call to discuss.",
      timestamp: new Date(Date.now() - 86400000 * 2),
      sender: 'agent1',
      read: true
    },
    unreadCount: 0,
    type: 'opportunities',
    project: null,
    starred: false
  },
  {
    id: '4',
    participant: {
      id: 'cd3',
      name: 'Amy Rodriguez',
      role: 'Casting Director',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=AR',
      company: 'Independent Films'
    },
    lastMessage: {
      id: 'm4',
      content: "Congratulations! You've been selected for the Supporting Lead role. Contract details attached.",
      timestamp: new Date(Date.now() - 86400000 * 3),
      sender: 'cd3',
      read: true
    },
    unreadCount: 0,
    type: 'booking',
    project: 'Indie Horror Film',
    starred: true
  },
  {
    id: '5',
    participant: {
      id: 'cd4',
      name: 'Robert Hayes',
      role: 'Theater Director',
      avatar: 'https://placehold.co/40x40/e8d5f2/9c27b0?text=RH',
      company: 'Shakespeare in the Park'
    },
    lastMessage: {
      id: 'm5',
      content: "Thank you for your workshop audition. While we were impressed, we've decided to go with another actor for this production.",
      timestamp: new Date(Date.now() - 86400000 * 5),
      sender: 'cd4',
      read: true
    },
    unreadCount: 0,
    type: 'rejection',
    project: 'Hamlet',
    starred: false
  }
]

// Mock current conversation messages
const currentMessages = [
  {
    id: 'm1-1',
    content: "Hi Alex! I hope you're doing well. I wanted to reach out about your audition for the Daniel role in Breaking Chains.",
    timestamp: new Date(Date.now() - 7200000),
    sender: 'cd1',
    read: true,
    type: 'text'
  },
  {
    id: 'm1-2',
    content: "We were really impressed with your self-tape and would love to bring you in for a callback.",
    timestamp: new Date(Date.now() - 7000000),
    sender: 'cd1',
    read: true,
    type: 'text'
  },
  {
    id: 'm1-3',
    content: "Thank you so much! I'm really excited about this opportunity. When were you thinking for the callback?",
    timestamp: new Date(Date.now() - 6800000),
    sender: 'actor',
    read: true,
    type: 'text'
  },
  {
    id: 'm1-4',
    content: "Would next Tuesday afternoon work for you? Around 2:30 PM? The callback will be in-person at our studio in LA.",
    timestamp: new Date(Date.now() - 3600000),
    sender: 'cd1',
    read: false,
    type: 'text'
  }
]

export default function Messages() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [newMessage, setNewMessage] = useState('')
  
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (conv.project && conv.project.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === 'all' || conv.type === filterType
    
    return matchesSearch && matchesType
  })
  
  const unreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'callback': return 'bg-purple-100 text-purple-700'
      case 'booking': return 'bg-green-100 text-green-700'
      case 'feedback': return 'bg-blue-100 text-blue-700'
      case 'opportunities': return 'bg-yellow-100 text-yellow-700'
      case 'rejection': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'callback': return 'Callback'
      case 'booking': return 'Booking'
      case 'feedback': return 'Feedback'
      case 'opportunities': return 'Opportunities'
      case 'rejection': return 'Update'
      default: return 'Message'
    }
  }
  
  const sendMessage = () => {
    if (!newMessage.trim()) return
    
    // Handle sending message
    console.log('Sending message:', newMessage)
    setNewMessage('')
  }
  
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }
  
  return (
    <AppLayout>
      <PageHeader
        title="Messages"
        subtitle={`${unreadCount} unread messages`}
        actions={
          <Button variant="default">
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        }
      />
      
      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
            
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                onClick={() => setFilterType('all')}
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                All ({conversations.length})
              </Button>
              <Button
                onClick={() => setFilterType('callback')}
                variant={filterType === 'callback' ? 'default' : 'outline'}
                size="sm"
              >
                Callbacks
              </Button>
              <Button
                onClick={() => setFilterType('booking')}
                variant={filterType === 'booking' ? 'default' : 'outline'}
                size="sm"
              >
                Bookings
              </Button>
              <Button
                onClick={() => setFilterType('opportunities')}
                variant={filterType === 'opportunities' ? 'default' : 'outline'}
                size="sm"
              >
                Opportunities
              </Button>
            </div>
            
            {/* Conversations */}
            <div className="overflow-y-auto">
              {filteredConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className={`cursor-pointer transition-all border-l-2 ${
                    selectedConversation.id === conversation.id 
                      ? 'border-l-primary-500 bg-primary-50' 
                      : 'border-l-transparent hover:bg-gray-50'
                  } ${index !== 0 ? 'border-t' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="px-3 py-2">
                    <div className="flex items-start gap-2">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <img 
                            src={conversation.participant.avatar} 
                            alt={conversation.participant.name}
                            className="w-full h-full object-cover rounded"
                          />
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-medium text-white">
                              {conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium text-sm truncate ${
                                conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {conversation.participant.name}
                              </h4>
                              {conversation.starred && (
                                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {conversation.participant.company}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessage.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 mb-1">
                          <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${getTypeColor(conversation.type)}`}>
                            {getTypeLabel(conversation.type)}
                          </span>
                          {conversation.project && (
                            <span className="text-xs text-gray-500 truncate">
                              {conversation.project}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-xs line-clamp-1 ${
                          conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Message Thread */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {/* Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <img 
                        src={selectedConversation.participant.avatar} 
                        alt={selectedConversation.participant.name}
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedConversation.participant.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.participant.company} • {selectedConversation.participant.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {selectedConversation.project && (
                  <div className="pt-2">
                    <Badge className={getTypeColor(selectedConversation.type)}>
                      {selectedConversation.project} - {getTypeLabel(selectedConversation.type)}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {currentMessages.map((message) => {
                  const isFromUser = message.sender === 'actor'
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${
                        isFromUser ? 'order-2' : 'order-1'
                      }`}>
                        <div className={`px-4 py-3 rounded-lg ${
                          isFromUser 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 px-1 ${
                          isFromUser ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-xs text-gray-400">
                            {formatTime(message.timestamp)}
                          </span>
                          {isFromUser && (
                            <div className="text-gray-400">
                              {message.read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Attach image">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="w-4 h-4" />
                  </Button>
                  
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContent>
    </AppLayout>
  )
}
