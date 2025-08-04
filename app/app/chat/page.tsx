'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Send, Sparkles, Star, ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// Remove direct OpenAI imports - we'll use API routes instead
import { getCompatibilityScore, generateSoulmatePrompt, getZodiacSign } from '@/lib/utils'
import { GENDER_OPTIONS, RACE_OPTIONS } from '@/types'
import Image from 'next/image'
import ProtectedRoute from '@/components/ProtectedRoute'

// Typing animation component
interface TypingMessageProps {
  content: string
  isTyping: boolean
}
interface TypingMessageProps {
  content: string
  isTyping: boolean
}

const TypingMessage: React.FC<TypingMessageProps> = ({ content, isTyping }) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content)
      return
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, 30) // Adjust speed here (lower = faster)

      return () => clearTimeout(timer)
    }
  }, [content, isTyping, currentIndex])

  useEffect(() => {
    if (isTyping) {
      setDisplayedContent('')
      setCurrentIndex(0)
    }
  }, [content, isTyping])

  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words max-w-full chat-message-text">
      {displayedContent}
      {isTyping && currentIndex < content.length && (
        <span className="animate-pulse text-purple-400">|</span>
      )}
    </p>
  )
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  imageUrl?: string
  isPreferenceStep?: boolean
  preferences?: {
    genderPreference?: string
    racePreference?: string[]
  }
  suggestedResponses?: string[]
}

interface User {
  userId: string
  name: string
  birthday: string
  birthLocation: string
  zodiacSign: string
  onboardingCompleted: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const chatType = searchParams.get('type') || 'general'
  
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'chat' | 'gender' | 'race' | 'generating' | 'result'>('chat')
  const [soulmatePreferences, setSoulmatePreferences] = useState<{
    gender: string
    ethnicity: string[]
  } | null>(null)
  const [genderPreference, setGenderPreference] = useState('')
  const [racePreference, setRacePreference] = useState<string[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [soulmateData, setSoulmateData] = useState<{
    imageUrl: string
    compatibilityScore: number
    analysis: string
    soulmateSign: string
  } | null>(null)
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([])
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  const scrollToLatestMessage = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const maxScrollTop = scrollHeight - clientHeight
      
      container.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    // Scroll to latest message when new messages are added
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToLatestMessage()
      }, 100)
    }
  }, [messages])

  useEffect(() => {
    // On initial load, scroll to top to show the first message
    if (messages.length === 1) {
      setTimeout(() => scrollToTop(), 100)
    }
  }, [messages.length])

  useEffect(() => {
    // Auto-resize textarea when input value changes
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputValue])

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem('sidusUser')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      initializeChat(parsedUser, chatType)
    } else {
      router.push('/')
    }
  }, [chatType, router])

  const initializeChat = async (userData: User, type: string) => {
    let welcomeMessage = ''
    
    // Check for preset soulmate compatibility
    const preset = searchParams.get('preset')
    
    switch (type) {
      case 'general':
        welcomeMessage = `Hey ${userData.name}! I'm so glad you're here. As we talk, I'll keep your chart, the chart of people you share with me, and other important details you mention in mind.\n\nWhat's on your mind?`
        break
      case 'horoscope':
        // Generate a personalized horoscope message for their sign
        welcomeMessage = `${userData.zodiacSign}, financial matters require your careful attention today; analyze your budget and make informed decisions. A simple act of kindness can brighten someone's day and create a ripple effect of positivity. Embrace the power of small gestures to make a big difference.`
        break
      case 'compatibility':
        if (preset === 'soulmate') {
          const soulmateData = localStorage.getItem('soulmateForCompatibility')
          if (soulmateData) {
            const soulmate = JSON.parse(soulmateData)
            welcomeMessage = `I've analyzed your soulmate's astrological profile and I'm excited to share what I've discovered about your cosmic connection! Your compatibility with this ${soulmate.sunSign} sun, ${soulmate.moonSign} moon, ${soulmate.risingSign} rising combination is truly remarkable. This shows you what ideal compatibility looks like for you.`
          } else {
            welcomeMessage = `Who do you want to check compatibility with?`
          }
        } else {
          welcomeMessage = `Who do you want to check compatibility with?`
        }
        break
      case 'soulmate':
        // Check if user already has a soulmate
        try {
          const response = await fetch('/api/soulmates')
          const data = await response.json()
          
          if (data.success && data.data) {
            // User has a soulmate, redirect to results page
            const soulmate = data.data
            const imageUrl = soulmate.image_url
            const compatibility = soulmate.compatibility_info.compatibility_score
            const soulmateSign = soulmate.astrological_info.soulmate_sign
            const analysis = soulmate.compatibility_info.analysis
            const sunSign = soulmate.astrological_info.sun_sign
            const moonSign = soulmate.astrological_info.moon_sign
            const risingSign = soulmate.astrological_info.rising_sign
            
            const shortDescription = soulmate.compatibility_info.short_description || ''
            router.push(`/app/soulmate/result?imageUrl=${encodeURIComponent(imageUrl)}&compatibility=${compatibility}&soulmateSign=${encodeURIComponent(soulmateSign)}&analysis=${encodeURIComponent(analysis)}&sunSign=${encodeURIComponent(sunSign)}&moonSign=${encodeURIComponent(moonSign)}&risingSign=${encodeURIComponent(risingSign)}&shortDescription=${encodeURIComponent(shortDescription)}`)
            return
          }
        } catch (error) {
          console.error('Error checking for existing soulmate:', error)
        }
        
        // No existing soulmate, start with welcome message
        welcomeMessage = `Hello ${userData.name}! I'm excited to help you find your soulmate. The universe has been whispering about a special connection waiting for you. To divine your perfect match, I need to understand your preferences. What gender are you attracted to?`
        break
      case 'friend-compatibility':
        welcomeMessage = `Who do you want to check compatibility with?`
        break
      case 'dream-interpreter':
        welcomeMessage = `Tell me about your dreams and I can help you understand them`
        break
      case 'astrological-events':
        welcomeMessage = `Let's talk about the planets`
        break
      case 'tarot-interpreter':
        welcomeMessage = `Let's talk tarot...do you have a card in mind or would you like me to pull one for you?`
        break
      case 'personal-growth':
        welcomeMessage = `What do you want to work on?`
        break
      default:
        welcomeMessage = `Hello ${userData.name}! How can I guide you today?`
    }

    // Create initial message for all chat types
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }

    setMessages([initialMessage])
    
    // Trigger typing animation for initial message
    setTypingMessageId('1')
    const typingDuration = welcomeMessage.length * 30 + 500
    setTimeout(() => {
      setTypingMessageId(null)
      // For soulmate chat, show gender selection after initial message
      if (type === 'soulmate') {
        setCurrentStep('gender')
      }
    }, typingDuration)

    // Generate dynamic suggestions
    // await generateDynamicSuggestions(userData, type)
    
    // Add suggested responses for soulmate compatibility
    if (type === 'compatibility' && preset === 'soulmate') {
      setSuggestedResponses([
        'What makes us so compatible?',
        'What challenges might we face together?',
        'How can we strengthen our connection?'
      ])
    }
  }

  const generateDynamicSuggestions = async (userData: User, type: string) => {
    try {
      const response = await fetch('/api/chat/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatType: type,
          userContext: {
            userId: userData.userId,
            name: userData.name,
            zodiacSign: userData.zodiacSign,
            birthday: userData.birthday,
            birthLocation: userData.birthLocation
          },
          conversationHistory: messages
        })
      })
      
      const data = await response.json()
      if (data.success && data.suggestions) {
        setSuggestedResponses(data.suggestions)
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      // Fallback to default suggestions
      const fallbackSuggestions = [
        'How does my chart affect my relationships?',
        'What should I focus on this week?',
        'How can I improve my communication?'
      ]
      setSuggestedResponses(fallbackSuggestions)
    }
  }

  const addMessage = async (content: string, role: 'user' | 'assistant', imageUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      imageUrl
    }
    setMessages(prev => [...prev, newMessage])
    
    // Scroll to latest message immediately when message is added
    setTimeout(() => {
      scrollToLatestMessage()
    }, 50)
    
    // Trigger typing animation for assistant messages
    if (role === 'assistant') {
      setTypingMessageId(newMessage.id)
      
      // Stop typing animation after the content length * typing speed + buffer
      const typingDuration = content.length * 30 + 500
      setTimeout(() => {
        setTypingMessageId(null)
        // Scroll again after typing animation completes
        setTimeout(() => {
          scrollToLatestMessage()
        }, 100)
      }, typingDuration)

      // Generate new suggestions after assistant response
      // if (user) {
      //   await generateDynamicSuggestions(user, chatType)
      // }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || typingMessageId !== null) return

    const userMessage = inputValue.trim()
    await addMessage(userMessage, 'user')
    setInputValue('')
    setSuggestedResponses([])
    setIsLoading(true)

    try {
      if (chatType === 'soulmate' && currentStep === 'chat') {
        // Check if user wants to start soulmate generation
        if (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('ready')) {
          setCurrentStep('gender')
          await addMessage("Perfect! First, what gender are you interested in?", 'assistant')
        } else {
          // Use regular chat API for soulmate conversations too
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMessage, timestamp: new Date() }].map(m => ({ role: m.role, content: m.content })),
              chatType,
              userContext: user
            })
          })
          
          const data = await response.json()
          if (data.success && data.message) {
            await addMessage(data.message, 'assistant')
          } else {
            throw new Error(data.error || 'Failed to get response')
          }
        }
      } else {
        // Regular chat response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMessage, timestamp: new Date() }].map(m => ({ role: m.role, content: m.content })),
            chatType,
            userContext: user
          })
        })
        
        const data = await response.json()
        if (data.success && data.message) {
          await addMessage(data.message, 'assistant')
        } else {
          throw new Error(data.error || 'Failed to get response')
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      await addMessage("I'm experiencing cosmic interference. Please try again.", 'assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenderSelection = async (gender: string) => {
    setGenderPreference(gender)
    setCurrentStep('race')
    
    // Add user's gender selection as a message with proper label
    const genderLabel = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'All'
    await addMessage(genderLabel, 'user')
    await addMessage("Perfect! Now, what ethnic background(s) are you attracted to? You can select multiple options to help me find your perfect cosmic match.", 'assistant')
  }

  const handleRaceSelection = async () => {
    if (racePreference.length === 0) return
    
    // Store preferences
    const preferences = {
      gender: genderPreference,
      ethnicity: racePreference
    }
    setSoulmatePreferences(preferences)
    
    // Add user selection to chat with proper labels
    const raceLabels = racePreference.map(race => {
      const raceOption = RACE_OPTIONS.find(option => option.value === race)
      return raceOption ? raceOption.label : race
    })
    await addMessage(raceLabels.join(', '), 'user')
    await addMessage("Excellent choices! The universe is ready to reveal your soulmate. Let me consult the cosmic forces...", 'assistant')
    
    // Navigate to soulmate generation page
    router.push(`/app/soulmate/generate?gender=${encodeURIComponent(genderPreference)}&ethnicity=${encodeURIComponent(racePreference.join(','))}`)
  }

  const generateSoulmate = async () => {
    try {
      setGenerationProgress(0)
      
      // Progress animation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + Math.random() * 15
        })
      }, 500)

      // Call soulmate API to generate everything
      const response = await fetch('/api/soulmate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSign: user?.zodiacSign,
          genderPreference,
          racePreference
        })
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate soulmate')
      }

      const { imageUrl, soulmateSign, compatibilityScore: compatibility, analysis } = data.data

      clearInterval(progressInterval)
      setGenerationProgress(100)
      
      setSoulmateData({
        imageUrl,
        compatibilityScore: compatibility,
        analysis,
        soulmateSign
      })
      
      setCurrentStep('result')
      
      setTimeout(async () => {
        await addMessage(
          `Behold! The cosmos has revealed your soulmate - a ${soulmateSign} with ${compatibility}% compatibility! ✨`,
          'assistant',
          imageUrl
        )
      }, 1500)
      
    } catch (error) {
      console.error('Error generating soulmate:', error)
      await addMessage("The cosmic energies are unstable right now. Please try again later.", 'assistant')
      setCurrentStep('chat')
    }
  }

  const handleLearnMore = async () => {
    if (soulmateData) {
      await addMessage("Tell me more about our connection!", 'user')
      await addMessage(soulmateData.analysis, 'assistant')
    }
  }

  const handleSuggestedResponse = async (suggestion: string) => {
    if (isLoading || typingMessageId !== null) return
    
    setSuggestedResponses([])
    await addMessage(suggestion, 'user')
    setIsLoading(true)

    try {
      // Regular chat response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: suggestion }].map(m => ({ role: m.role, content: m.content })),
          chatType,
          userContext: user
        })
      })
      
      const data = await response.json()
      if (data.success && data.message) {
        await addMessage(data.message, 'assistant')
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      await addMessage("I'm experiencing cosmic interference. Please try again.", 'assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    
    // Auto-resize textarea
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, 120) + 'px'
    
    // Handle Enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getChatTitle = () => {
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



  const DiviningSoulmate = () => (
    <motion.div
      className="text-center py-8 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative">
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center divining-animation"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Divining Your Soulmate...</h3>
        <Progress value={generationProgress} className="w-full max-w-xs mx-auto" />
        <p className="text-sm text-gray-400">The universe is aligning the stars for you</p>
      </div>
    </motion.div>
  )

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

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-black text-white mobile-chat-container">
        {/* Header - Always Visible */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0 z-10 bg-black">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors touch-target"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold capitalize truncate px-2">{getChatTitle()}</h1>
          <div className="w-10" />
        </div>

        {/* Messages Container - Scrollable with proper spacing for mobile */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-4 mobile-chat-messages">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2 max-w-full">
              {message.role === 'assistant' && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Astra:</div>
                  <div className="text-gray-300">
                    <TypingMessage 
                      content={message.content} 
                      isTyping={typingMessageId === message.id} 
                    />
                  </div>
                </div>
              )}
              {message.role === 'user' && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">You:</div>
                  <div className="text-white">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words chat-message-text">
                      {message.content}
                    </p>
                  </div>
                </div>
              )}
              {message.imageUrl && (
                <div className="mt-3">
                  <img 
                    src={message.imageUrl} 
                    alt="Generated content" 
                    className="max-w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="text-sm text-gray-400">Astra:</div>
              </div>
              <div className="text-gray-300 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">Consulting the cosmic forces...</span>
              </div>
            </div>
          )}

          {/* Soulmate Generation Progress */}
          {currentStep === 'generating' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Manifesting Your Soulmate</h3>
                  <p className="text-gray-400 text-sm">The universe is aligning the perfect cosmic match for you...</p>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Gender Selection */}
          {currentStep === 'gender' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Gender Preference</h3>
                <p className="text-gray-400 text-sm">What gender are you attracted to?</p>
              </div>
              <div className="space-y-3">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleGenderSelection(option.value)}
                    className="w-full p-4 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 rounded-lg transition-all duration-300"
                  >
                    <div className="text-white font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Race Selection */}
          {currentStep === 'race' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-2">Ethnic Background</h3>
                <p className="text-gray-400 text-sm">What ethnic background(s) attract you? (Select multiple)</p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {RACE_OPTIONS.map((option, index) => (
                  <div 
                    key={option.value} 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-all duration-300"
                  >
                    <input
                      type="checkbox"
                      id={option.value}
                      checked={racePreference.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRacePreference(prev => [...prev, option.value])
                        } else {
                          setRacePreference(prev => prev.filter(r => r !== option.value))
                        }
                      }}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor={option.value} className="text-gray-300 cursor-pointer flex-1">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleRaceSelection}
                disabled={racePreference.length === 0}
                className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-3 text-lg font-semibold disabled:opacity-50"
              >
                Continue
              </Button>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom with Mobile Optimization */}
        {(currentStep === 'chat' || currentStep === 'result') && (
          <div className="border-t border-gray-800 flex-shrink-0 p-4 bg-black pb-safe z-10 mobile-chat-input-fixed">
            {/* Suggested Responses */}
            {suggestedResponses.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {suggestedResponses.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestedResponse(suggestion)}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 rounded-full text-sm text-gray-300 hover:text-white transition-all duration-300 touch-target"
                      disabled={isLoading}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full bg-gray-800 text-white rounded-2xl pl-4 pr-12 py-3 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none text-base resize-none min-h-[44px] max-h-[120px] leading-5"
                disabled={isLoading}
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '44px',
                  maxHeight: '120px',
                  paddingTop: '12px',
                  paddingBottom: '12px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || typingMessageId !== null}
                className={`absolute right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 touch-target ${
                  inputValue.trim() && !isLoading && typingMessageId === null
                    ? 'text-white hover:text-gray-200 hover:bg-gray-700/50'
                    : 'text-gray-500'
                }`}
                style={{ 
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
