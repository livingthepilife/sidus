'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Send, Sparkles, Calendar, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { generateChatResponse } from '@/lib/openai'
import { getZodiacSign, calculateBigThree } from '@/lib/utils'
import { searchCities } from '@/lib/cities'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { InlineDatePicker, InlineTimePicker, InlineLocationSearch } from '@/components/ui/inline-ios-pickers'

// Typing animation component
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
    <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
}

interface OnboardingData {
  name?: string
  birthday?: string
  birthTime?: string
  birthLocation?: string
  zodiacSign?: string
  moonSign?: string
  risingSign?: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [inputMode, setInputMode] = useState<'chat' | 'birthday' | 'birthTime' | 'location'>('chat')
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [])

  useEffect(() => {
    // Only scroll if there are messages and the chat area exists
    if (messages.length > 0) {
      // Small delay to ensure the message is rendered before scrolling
      const timer = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, scrollToBottom])

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "Welcome to your cosmic journey! I am Sidus, your celestial guide. To reveal your destiny among the stars, I need to know a few things about you. Let's start with your first name.",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    // Trigger typing animation for initial message
    setTypingMessageId('1')
    const typingDuration = welcomeMessage.content.length * 30 + 500
    setTimeout(() => {
      setTypingMessageId(null)
    }, typingDuration)
  }, [])

  // Auto-scroll when buttons appear
  useEffect(() => {
    if (inputMode === 'birthTime' && currentStep === 2) {
      const timer = setTimeout(scrollToBottom, 300)
      return () => clearTimeout(timer)
    }
  }, [inputMode, currentStep, scrollToBottom])

  useEffect(() => {
    if (inputMode === 'location' && currentStep === 3) {
      const timer = setTimeout(scrollToBottom, 300)
      return () => clearTimeout(timer)
    }
  }, [inputMode, currentStep, scrollToBottom])

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    
    // Trigger typing animation for assistant messages
    if (role === 'assistant') {
      setTypingMessageId(newMessage.id)
      
      // Stop typing animation after the content length * typing speed + buffer
      const typingDuration = content.length * 30 + 500
      setTimeout(() => {
        setTypingMessageId(null)
      }, typingDuration)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    addMessage(userMessage, 'user')
    setInputValue('')
    setIsLoading(true)

    try {
      await processUserResponse(userMessage)
    } catch (error) {
      console.error('Error processing message:', error)
      addMessage("I'm experiencing cosmic interference. Could you please try again?", 'assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateSelect = (date: string) => {
    // Convert MM/DD/YYYY to YYYY-MM-DD for storage
    const [month, day, year] = date.split('/')
    const birthday = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    const zodiacSign = getZodiacSign(birthday)
    
    setOnboardingData(prev => ({ 
      ...prev, 
      birthday,
      zodiacSign 
    }))
    
    // Don't immediately proceed - wait for user interaction
  }

  const handleDateConfirm = () => {
    if (!onboardingData.birthday || !onboardingData.zodiacSign) return
    
    // Convert back to display format
    const date = new Date(onboardingData.birthday)
    const displayDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
    
    setInputMode('chat')
    addMessage(displayDate, 'user')
    
    setTimeout(() => {
      addMessage(`Ah, a ${onboardingData.zodiacSign}! The cosmic energies are strong with you. Now, do you know your exact time of birth? This will help me calculate your Moon and Rising signs for a complete astrological profile.`, 'assistant')
      setCurrentStep(2)
      setTimeout(() => {
        setInputMode('birthTime')
      }, 1000)
    }, 1000)
  }

  const handleTimeSelect = (time: string) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      birthTime: time
    }))
    
    // Don't immediately proceed - wait for user interaction
  }

  const handleTimeConfirm = () => {
    if (!onboardingData.birthTime) return
    
    setInputMode('chat')
    addMessage(onboardingData.birthTime, 'user')
    
    setTimeout(() => {
      addMessage(`Perfect! Now I can calculate your complete cosmic blueprint. Finally, where were you born?`, 'assistant')
      setCurrentStep(3)
      setTimeout(() => {
        setInputMode('location')
      }, 1000)
    }, 1000)
  }

  const handleTimeSkip = () => {
    setOnboardingData(prev => ({ 
      ...prev, 
      birthTime: 'Unknown'
    }))
    
    setInputMode('chat')
    addMessage('Unknown', 'user')
    
    setTimeout(() => {
      addMessage(`Perfect! Now I can calculate your complete cosmic blueprint. Finally, where were you born?`, 'assistant')
      setCurrentStep(3)
      setTimeout(() => {
        setInputMode('location')
      }, 1000)
    }, 1000)
  }

  const handleLocationSelect = (location: string) => {
    // Calculate all three signs when we have complete birth information
    const bigThree = calculateBigThree(onboardingData.birthday!, onboardingData.birthTime, location)
    
    setOnboardingData(prev => ({ 
      ...prev, 
      birthLocation: location,
      zodiacSign: bigThree.sunSign,
      moonSign: bigThree.moonSign,
      risingSign: bigThree.risingSign
    }))
    
    setInputMode('chat')
    addMessage(location, 'user')
    
    setTimeout(() => {
      addMessage(`Perfect! Born in ${location} under the Sun sign of ${bigThree.sunSign}, with Moon in ${bigThree.moonSign} and ${bigThree.risingSign} rising. The universe has revealed your complete cosmic blueprint to me. Your journey through the stars begins now!`, 'assistant')
      setCurrentStep(4)
      
      setTimeout(() => {
        addMessage('Archiving this chat...', 'assistant')
        setTimeout(() => {
          completeOnboarding()
        }, 2500)
      }, 3000)
    }, 1000)
  }



  const processUserResponse = async (userInput: string) => {
    let response = ''
    let nextStep = currentStep

    switch (currentStep) {
      case 0: // Getting name
        setOnboardingData(prev => ({ ...prev, name: userInput }))
        response = `${userInput}, what a beautiful name! The stars are already whispering about you. Now, I need to know your exact birth date to map your cosmic blueprint.`
        nextStep = 1
        
        setTimeout(() => {
          setInputMode('birthday')
        }, 2000)
        break

      default:
        response = "Your cosmic profile is complete! Redirecting you to your celestial dashboard..."
        setTimeout(() => {
          completeOnboarding()
        }, 2000)
        break
    }

    setTimeout(() => {
      addMessage(response, 'assistant')
      setCurrentStep(nextStep)
    }, 1000)
  }

  const shouldShowInput = () => {
    return inputMode === 'chat' && currentStep === 0
  }



  const completeOnboarding = async () => {
    if (!user) return
    
    setIsLoading(true)
    
    try {
      // Calculate the big three signs
      const bigThree = calculateBigThree(
        onboardingData.birthday || '',
        onboardingData.birthTime || '',
        onboardingData.birthLocation || ''
      )
      
      console.log('Calculated astrological signs:', bigThree)
      console.log('Onboarding data:', onboardingData)
      
      // Test calculations to verify they're working
      const testCalculation = calculateBigThree('2000-02-01', '12:00 AM', 'Test Location')
      console.log('Test calculation (Feb 1 2000, 12:00 AM):', testCalculation)
      
      // Ensure all three signs are present
      const astrologicalInfo = {
        sun_sign: bigThree.sunSign || 'Unknown',
        moon_sign: bigThree.moonSign || 'Unknown',
        rising_sign: bigThree.risingSign || 'Unknown'
      }
      
      console.log('Astrological info to save:', astrologicalInfo)
      
      // Validate that we actually have valid signs
      if (!astrologicalInfo.sun_sign) {
        console.error('Warning: Sun sign calculation failed')
        astrologicalInfo.sun_sign = 'Aries' // Default to a valid sign
      }
      if (!astrologicalInfo.moon_sign) {
        console.error('Warning: Moon sign calculation failed')
        astrologicalInfo.moon_sign = 'Aries' // Default to a valid sign
      }
      if (!astrologicalInfo.rising_sign) {
        console.error('Warning: Rising sign calculation failed')
        astrologicalInfo.rising_sign = 'Aries' // Default to a valid sign
      }
      
      // Save onboarding data to user_stats table
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: user.id,
          astrological_info: astrologicalInfo,
          basic_info: {
            first_name: onboardingData.name,
            birth_date: onboardingData.birthday,
            birth_time: onboardingData.birthTime,
            birth_location: onboardingData.birthLocation
          },
          subscription_status: 'none' // Initialize with no subscription
        })
      
      if (error) {
        console.error('Error saving onboarding data:', error)
        // Still redirect to app even if database save fails
        // The user can complete onboarding again later if needed
      } else {
        console.log('Successfully saved onboarding data to database')
      }
      
      // Also save to localStorage as backup for immediate access
      localStorage.setItem('sidusUser', JSON.stringify({
        userId: user.id,
        name: onboardingData.name,
        birthday: onboardingData.birthday,
        birthTime: onboardingData.birthTime,
        birthLocation: onboardingData.birthLocation,
        zodiacSign: astrologicalInfo.sun_sign,
        moonSign: astrologicalInfo.moon_sign,
        risingSign: astrologicalInfo.rising_sign,
        onboardingCompleted: true
      }))
      
      // Redirect to intro page with a small delay to ensure data is saved
      console.log('Onboarding completed, redirecting to /intro')
      setTimeout(() => {
        router.push('/intro')
      }, 500)
    } catch (error) {
      console.error('Error completing onboarding:', error)
      // Still redirect even if there's an error
      setTimeout(() => {
        router.push('/intro')
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => router.push('/')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Cosmic Onboarding</h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-73px)]">
        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.role === 'assistant' && (
                    <div className="flex items-start space-x-2">
                      <div className="text-sm text-gray-400">Sidus:</div>
                    </div>
                  )}
                  {message.role === 'user' && (
                    <div className="flex items-start space-x-2">
                      <div className="text-sm text-gray-400">You:</div>
                    </div>
                  )}
                  <div className={`${message.role === 'user' ? 'text-white' : 'text-gray-300'}`}>
                    {message.role === 'assistant' ? (
                      <TypingMessage 
                        content={message.content} 
                        isTyping={typingMessageId === message.id} 
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="text-sm text-gray-400">Sidus:</div>
                  </div>
                  <div className="text-gray-300 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm">Consulting the stars...</span>
                  </div>
                </div>
              )}

              {/* Inline Birthday Selection */}
              {inputMode === 'birthday' && currentStep === 1 && (
                <div className="space-y-4">
                  <InlineDatePicker
                    onDateSelect={handleDateSelect}
                  />
                  <Button 
                    onClick={handleDateConfirm}
                    disabled={!onboardingData.birthday}
                    className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-3 disabled:opacity-50"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Inline Birth Time Selection */}
              {inputMode === 'birthTime' && currentStep === 2 && (
                <div className="space-y-4">
                  <InlineTimePicker
                    onTimeSelect={handleTimeSelect}
                  />
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleTimeConfirm}
                      disabled={!onboardingData.birthTime}
                      className="flex-1 bg-white text-black hover:bg-gray-200 rounded-full py-3 disabled:opacity-50"
                    >
                      Continue
                    </Button>
                    <Button 
                      onClick={handleTimeSkip}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-full py-3"
                    >
                      I don't know
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline Location Selection */}
              {inputMode === 'location' && currentStep === 3 && (
                <InlineLocationSearch
                  onLocationSelect={handleLocationSelect}
                  searchCities={searchCities}
                  placeholder="Search for your birth location..."
                />
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Regular Chat Input */}
        {shouldShowInput() && (
          <div className="p-4 border-t border-gray-800">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Your first name"
                className="w-full bg-gray-800 text-white rounded-full pl-4 pr-12 py-3 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors disabled:opacity-50