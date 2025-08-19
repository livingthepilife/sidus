'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Send, Sparkles, Star, ArrowUp, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
// Remove direct OpenAI imports - we'll use API routes instead
import { getCompatibilityScore, generateSoulmatePrompt, getZodiacSign } from '@/lib/utils'
import { GENDER_OPTIONS, RACE_OPTIONS } from '@/types'
import ProtectedRoute from '@/components/ProtectedRoute'

// Send Button SVG Component
const SendButtonIcon = ({ className, fill = "currentColor" }: { className?: string, fill?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    height="24px" 
    viewBox="0 -960 960 960" 
    width="24px" 
    fill={fill}
    className={className}
  >
    <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/>
  </svg>
)

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
  const [hasUserSentFirstMessage, setHasUserSentFirstMessage] = useState(false)
  const [currentHoroscope, setCurrentHoroscope] = useState<string>('')
  
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

  // Get today's date as string for comparison
  const getTodayString = () => {
    return new Date().toDateString()
  }

  // Clean up old horoscope entries (keep only last 7 days)
  const cleanupOldHoroscopes = (userId: string) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Get all localStorage keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`dailyHoroscope_${userId}_`)) {
        const dateStr = key.replace(`dailyHoroscope_${userId}_`, '')
        const entryDate = new Date(dateStr)
        if (entryDate < sevenDaysAgo) {
          keysToRemove.push(key)
        }
      }
    }
    
    // Remove old entries
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  // Get or generate daily horoscope
  const getDailyHoroscope = async (userData: User): Promise<string> => {
    const today = getTodayString()
    const storageKey = `dailyHoroscope_${userData.userId}_${today}`
    
    // Clean up old horoscopes
    cleanupOldHoroscopes(userData.userId)
    
    // Check if we have today's horoscope in localStorage
    const existingHoroscope = localStorage.getItem(storageKey)
    if (existingHoroscope) {
      console.log('Using existing horoscope for today')
      return existingHoroscope
    }

    // Generate new horoscope for today
    try {
      console.log('Generating new horoscope for today')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'user', 
              content: `Generate a personalized daily horoscope for today (${today}) for a ${userData.zodiacSign}. Make it specific, insightful, and different from previous days. Include advice about love, career, health, or personal growth. Keep it conversational and engaging, around 3-4 sentences.`
            }
          ],
          chatType: 'horoscope',
          userContext: userData
        })
      })
      
      const data = await response.json()
      if (data.success && data.message) {
        // Store today's horoscope
        localStorage.setItem(storageKey, data.message)
        return data.message
      } else {
        throw new Error('Failed to generate horoscope')
      }
    } catch (error) {
      console.error('Error generating daily horoscope:', error)
      // Fallback horoscope
      const fallbackHoroscope = `${userData.zodiacSign}, today brings new opportunities for growth and connection. Trust your intuition as you navigate the day's challenges, and remember that every experience is teaching you something valuable. Focus on nurturing your relationships and staying open to unexpected possibilities.`
      localStorage.setItem(storageKey, fallbackHoroscope)
      return fallbackHoroscope
    }
  }

  useEffect(() => {
    // Load user data
    const userData = localStorage.getItem('sidusUser')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      // Reset first message tracking for new chat session
      setHasUserSentFirstMessage(false)
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
        // Get today's personalized horoscope
        welcomeMessage = await getDailyHoroscope(userData)
        setCurrentHoroscope(welcomeMessage)
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
      } else {
        // Generate preset questions for other chat types
        // For horoscope, wait a bit more to ensure currentHoroscope is set
        if (type === 'horoscope') {
          setTimeout(() => {
            const presetQuestions = generatePresetQuestions(userData, type)
            setSuggestedResponses(presetQuestions)
          }, 500)
        } else {
          const presetQuestions = generatePresetQuestions(userData, type)
          setSuggestedResponses(presetQuestions)
        }
      }
    }, typingDuration)
    
    // Add suggested responses for soulmate compatibility
    if (type === 'compatibility' && preset === 'soulmate') {
      setTimeout(() => {
      setSuggestedResponses([
        'What makes us so compatible?',
        'What challenges might we face together?',
        'How can we strengthen our connection?'
      ])
      }, typingDuration)
    }
  }

  // Generate horoscope-specific questions based on current horoscope content
  const generateHoroscopeQuestions = (horoscopeContent: string, userSign: string): string[] => {
    const contextualQuestions: string[] = []
    
    // Analyze horoscope content for keywords and generate relevant questions
    const content = horoscopeContent.toLowerCase()
    
    if (content.includes('love') || content.includes('relationship') || content.includes('romance')) {
      contextualQuestions.push('How can I improve my love life today?', 'What should I focus on in my relationships?')
    }
    
    if (content.includes('career') || content.includes('work') || content.includes('professional')) {
      contextualQuestions.push('How can I advance my career today?', 'What work opportunities should I watch for?')
    }
    
    if (content.includes('health') || content.includes('wellness') || content.includes('energy')) {
      contextualQuestions.push('How can I boost my energy today?', 'What health practices should I focus on?')
    }
    
    if (content.includes('financial') || content.includes('money') || content.includes('abundance')) {
      contextualQuestions.push('How can I improve my finances today?', 'What financial opportunities might arise?')
    }
    
    if (content.includes('communication') || content.includes('conversation') || content.includes('express')) {
      contextualQuestions.push('How can I communicate better today?', 'What important conversations should I have?')
    }
    
    if (content.includes('intuition') || content.includes('spiritual') || content.includes('inner')) {
      contextualQuestions.push('How can I trust my intuition more?', 'What spiritual practices would benefit me?')
    }
    
    if (content.includes('challenge') || content.includes('obstacle') || content.includes('difficult')) {
      contextualQuestions.push('How can I overcome today\'s challenges?', 'What obstacles should I prepare for?')
    }
    
    if (content.includes('opportunity') || content.includes('growth') || content.includes('potential')) {
      contextualQuestions.push('What opportunities should I watch for?', 'How can I maximize my growth today?')
    }
    
    // Add some general horoscope-related questions as backup
    const generalQuestions = [
      'What does this mean for my week ahead?',
      'How do planetary transits affect me today?',
      'What should I be most mindful of today?',
      'How can I align with today\'s cosmic energy?',
      'What does my rising sign add to this reading?',
      'How can I make the most of today\'s energy?'
    ]
    
    // Combine contextual and general questions
    const allQuestions = [...contextualQuestions, ...generalQuestions]
    
    // Shuffle and return 4-5 questions
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 4)
  }

  // Generate preset questions based on chat type
  const generatePresetQuestions = (userData: User, type: string): string[] => {
    // For horoscope chat, use context-aware questions based on current horoscope
    if (type === 'horoscope' && currentHoroscope) {
      return generateHoroscopeQuestions(currentHoroscope, userData.zodiacSign)
    }
    
    const baseQuestions = {
      general: [
        'How can I improve my health?',
        'Why am I so tired lately?',
        'What career path is right for me?',
        'How can I attract more abundance?',
        'What does my future hold?',
        'How can I improve my relationships?',
        'What should I focus on this month?',
        'How can I boost my confidence?',
        'What are my hidden talents?',
        'How can I find inner peace?',
        'What is blocking my success?',
        'How can I overcome procrastination?',
        'What decisions should I make soon?',
        'How can I improve my intuition?',
        'What patterns do I need to break?',
        'How can I attract my soulmate?',
        'What creative projects should I pursue?',
        'How can I improve my finances?',
        'What lessons am I learning now?',
        'How can I connect with my purpose?'
      ],
      horoscope: [
        'What should I focus on today?',
        'How will this week affect my love life?',
        'What challenges should I prepare for?',
        'What opportunities are coming?',
        'How can I make the most of this month?',
        'What does Mercury retrograde mean for me?',
        'How should I handle upcoming changes?',
        'What energy should I embrace today?',
        'How will the new moon affect me?',
        'What does my rising sign reveal?',
        'How can I work with lunar cycles?',
        'What planetary aspects impact me now?',
        'How should I prepare for Venus retrograde?',
        'What does Mars energy mean for me?',
        'How can I use Saturn\'s lessons?',
        'What does Jupiter expansion bring?'
      ],
      compatibility: [
        'How compatible are we long-term?',
        'What challenges might we face together?',
        'What draws us to each other?',
        'How can we strengthen our bond?',
        'What should we work on as a couple?',
        'Are we meant to be together?',
        'How can we better understand each other?',
        'What makes our connection special?',
        'How do our moon signs interact?',
        'What does our Venus compatibility show?',
        'How can we handle conflicts better?',
        'What karmic lessons do we share?',
        'How do our Mars signs affect passion?',
        'What does our composite chart reveal?',
        'How can we support each other\'s growth?',
        'What makes us magnetically attracted?'
      ],
      'friend-compatibility': [
        'How compatible are we as friends?',
        'What makes our friendship work?',
        'How can we support each other better?',
        'What should we be careful about?',
        'What do we learn from each other?',
        'How can we deepen our friendship?',
        'What makes us good friends?',
        'How do our energies complement?',
        'What adventures should we have together?',
        'How can we communicate better?',
        'What brings out the best in us?',
        'How can we navigate differences?',
        'What makes our bond special?',
        'How do we inspire each other?'
      ],
      'dream-interpreter': [
        'What does flying in dreams mean?',
        'Why do I keep having recurring dreams?',
        'What does water symbolize in dreams?',
        'Why do I dream about my ex?',
        'What do nightmares represent?',
        'How can I have lucid dreams?',
        'What does it mean to dream about death?',
        'Why do I dream about falling?',
        'What do animal dreams symbolize?',
        'Why do I dream about being chased?',
        'What does dreaming of fire mean?',
        'Why do I dream about lost teeth?',
        'What do pregnancy dreams represent?',
        'Why do I dream about storms?',
        'What does dreaming of houses mean?',
        'Why do I dream about celebrities?'
      ],
      'astrological-events': [
        'How will the next full moon affect me?',
        'What does Mercury retrograde mean?',
        'How should I prepare for eclipse season?',
        'What planetary transits are affecting me?',
        'How do Saturn returns work?',
        'What is Venus retrograde about?',
        'How do lunar phases impact emotions?',
        'What is Jupiter\'s influence this year?',
        'How do I work with Pluto transits?',
        'What does the new moon bring?',
        'How can I use Mars energy?',
        'What does Chiron healing represent?',
        'How do outer planets affect me?',
        'What is my progressed chart showing?',
        'How can I prepare for retrogrades?',
        'What does Neptune\'s influence mean?'
      ],
      'tarot-interpreter': [
        'Pull a card for my love life',
        'What guidance do I need today?',
        'Pull a career guidance card',
        'What should I know about my future?',
        'Pull a card for my spiritual path',
        'What energy should I embrace?',
        'Pull a card for overcoming obstacles',
        'What does my soul need right now?',
        'Pull a card for financial guidance',
        'What message does the universe have?',
        'Pull a card for healing',
        'What should I release today?',
        'Pull a card for new beginnings',
        'What wisdom do I need to hear?',
        'Pull a card for my highest good',
        'What does my intuition want to tell me?'
      ],
      'personal-growth': [
        'How can I build self-confidence?',
        'What limiting beliefs should I release?',
        'How can I overcome anxiety?',
        'What is my life purpose?',
        'How can I set better boundaries?',
        'What self-care practices suit me?',
        'How can I manifest my goals?',
        'What shadow work should I do?',
        'How can I heal my inner child?',
        'What chakras need balancing?',
        'How can I increase self-love?',
        'What habits should I cultivate?',
        'How can I trust my intuition more?',
        'What fears should I face?',
        'How can I embrace change?',
        'What gifts am I not using?',
        'How can I find my authentic self?',
        'What patterns need healing?'
      ],
      soulmate: [
        'How can I prepare to meet my soulmate?',
        'What qualities should I develop?',
        'What blocks me from finding love?',
        'How can I raise my vibration?',
        'What does my ideal partner look like?',
        'How will I know when I meet them?',
        'What lessons do I need first?',
        'How can I become more magnetic?',
        'What fears around love should I heal?',
        'How can I trust in divine timing?',
        'What does my heart truly desire?',
        'How can I be open to love?',
        'What past patterns should I release?',
        'How can I love myself more first?',
        'What signs will the universe send?',
        'How can I manifest true love?'
      ]
    }

    const questions = baseQuestions[type as keyof typeof baseQuestions] || baseQuestions.general
    
    // Shuffle and pick 4-5 random questions for horizontal scrolling
    const shuffled = [...questions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 4) // 4-5 questions randomly
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
      } else {
        // Use preset questions as fallback
        const presetQuestions = generatePresetQuestions(userData, type)
        setSuggestedResponses(presetQuestions)
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
      // Use preset questions as fallback
      const presetQuestions = generatePresetQuestions(userData, type)
      setSuggestedResponses(presetQuestions)
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

      // Don't generate new questions after assistant responses - only show them initially
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || typingMessageId !== null) return

    const userMessage = inputValue.trim()
    await addMessage(userMessage, 'user')
    setInputValue('')
    
    // Hide suggestions after user sends their first message
    if (!hasUserSentFirstMessage) {
      setHasUserSentFirstMessage(true)
    }
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
    
    // Clear suggestions and mark first message as sent since user is interacting
    setSuggestedResponses([])
    setHasUserSentFirstMessage(true)
    
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
    
    // Ensure suggestions remain cleared and first message is marked
    setSuggestedResponses([])
    setHasUserSentFirstMessage(true)
    
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
        
        // Don't show suggestions after soulmate reveal - maintain consistency
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
    
    // Hide suggestions after user sends their first message (via suggestion)
    if (!hasUserSentFirstMessage) {
      setHasUserSentFirstMessage(true)
    }
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
            {/* Preset Questions - Horizontal Scrolling - Only show before user's first message */}
            {suggestedResponses.length > 0 && !hasUserSentFirstMessage && (
              <div className="mb-4">
                <div className="overflow-x-auto scrollbar-hide" style={{ height: '60px', WebkitOverflowScrolling: 'touch' }}>
                  <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
                  {suggestedResponses.map((suggestion, index) => (
                    <motion.button
                      key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestedResponse(suggestion)}
                        className="flex-shrink-0 h-12 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600/50 hover:border-gray-500 rounded-2xl text-sm text-gray-300 hover:text-white transition-all duration-300 touch-target backdrop-blur-sm flex items-center justify-center min-w-fit"
                        disabled={isLoading || typingMessageId !== null}
                    >
                        <span className="whitespace-nowrap">
                      {suggestion}
                        </span>
                    </motion.button>
                  ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative flex items-center">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything..."
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
                className="absolute right-3 w-10 h-10 flex items-center justify-center transition-all duration-200 touch-target hover:scale-110 active:scale-95"
                style={{ 
                  top: '50%',
                  transform: 'translateY(-50%)',
                  minHeight: '40px',
                  minWidth: '40px'
                }}
              >
                <SendButtonIcon 
                  className="w-6 h-6" 
                  fill={
                    inputValue.trim() && !isLoading && typingMessageId === null
                      ? '#FFFFFF'
                      : '#6B7280'
                  }
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
