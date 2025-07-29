'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Clock, Star, Heart, Users, Moon, Sun, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatSession {
  id: string
  chatType: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface User {
  userId: string
  name: string
  zodiacSign: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('sidusUser')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      loadChatHistory(parsedUser.userId)
    } else {
      router.push('/')
    }
  }, [router])

  const loadChatHistory = async (userId: string) => {
    try {
      // For now, load from localStorage - later this would be from Supabase
      const savedChats = localStorage.getItem(`chatHistory_${userId}`)
      if (savedChats) {
        const chats = JSON.parse(savedChats)
        setChatSessions(chats.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChatIcon = (chatType: string) => {
    switch (chatType) {
      case 'general': return <MessageCircle className="w-5 h-5" />
      case 'horoscope': return <Star className="w-5 h-5" />
      case 'compatibility': return <Heart className="w-5 h-5" />
      case 'soulmate': return <Sparkles className="w-5 h-5" />
      case 'friend-compatibility': return <Users className="w-5 h-5" />
      case 'dream-interpreter': return <Moon className="w-5 h-5" />
      case 'astrological-events': return <Sun className="w-5 h-5" />
      case 'tarot-interpreter': return <Star className="w-5 h-5" />
      case 'personal-growth': return <Sparkles className="w-5 h-5" />
      default: return <MessageCircle className="w-5 h-5" />
    }
  }

  const getChatGradient = (chatType: string) => {
    switch (chatType) {
      case 'general': return 'from-purple-500 to-blue-600'
      case 'horoscope': return 'from-green-500 to-teal-600'
      case 'compatibility': return 'from-pink-500 to-rose-600'
      case 'soulmate': return 'from-orange-500 to-red-600'
      case 'friend-compatibility': return 'from-blue-500 to-cyan-600'
      case 'dream-interpreter': return 'from-indigo-500 to-purple-600'
      case 'astrological-events': return 'from-yellow-500 to-orange-600'
      case 'tarot-interpreter': return 'from-violet-500 to-purple-600'
      case 'personal-growth': return 'from-emerald-500 to-green-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getChatTitle = (chatType: string) => {
    switch (chatType) {
      case 'general': return 'Ask me anything'
      case 'horoscope': return 'Daily horoscope'
      case 'compatibility': return 'Romantic compatibility'
      case 'soulmate': return 'Your soulmate'
      case 'friend-compatibility': return 'Friend compatibility'
      case 'dream-interpreter': return 'Dream interpreter'
      case 'astrological-events': return 'Astrological events'
      case 'tarot-interpreter': return 'Tarot card interpreter'
      case 'personal-growth': return 'Personal growth'
      default: return 'Chat'
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const groupChatsByDate = (chats: ChatSession[]) => {
    const groups: { [key: string]: ChatSession[] } = {}
    
    chats.forEach(chat => {
      const dateKey = formatDate(chat.timestamp)
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(chat)
    })

    return Object.entries(groups).sort(([a], [b]) => {
      // Sort by "Today", "Yesterday", then by date
      if (a === 'Today') return -1
      if (b === 'Today') return 1
      if (a === 'Yesterday') return -1
      if (b === 'Yesterday') return 1
      return b.localeCompare(a)
    })
  }

  const handleChatSelect = (chatSession: ChatSession) => {
    // Navigate to the chat with the session ID to resume
    router.push(`/app/chat?type=${chatSession.chatType}&sessionId=${chatSession.id}`)
  }

  const handleBack = () => {
    router.back()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const groupedChats = groupChatsByDate(chatSessions)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-800 p-6 bg-black/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">History</h1>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
              </motion.div>
              <p className="text-gray-400 mt-4">Loading your cosmic conversations...</p>
            </div>
          ) : groupedChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No conversations yet</h3>
              <p className="text-gray-400 mb-6">Start a chat to see your conversation history here</p>
              <Button
                onClick={() => router.push('/app')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Start Your First Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedChats.map(([dateGroup, chats]) => (
                <div key={dateGroup} className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider px-2">
                    {dateGroup}
                  </h3>
                  <div className="space-y-2">
                    {chats.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full h-auto p-4 text-left justify-start hover:bg-gray-800/50 border border-gray-800/30 hover:border-purple-500/30 transition-all duration-300 rounded-2xl group"
                          onClick={() => handleChatSelect(chat)}
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getChatGradient(chat.chatType)} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 text-white`}>
                              {getChatIcon(chat.chatType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-white group-hover:text-purple-200 transition-colors duration-300 truncate">
                                  {chat.title}
                                </h4>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                  {chat.timestamp.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300 truncate">
                                {chat.lastMessage}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-purple-400">
                                  {getChatTitle(chat.chatType)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 