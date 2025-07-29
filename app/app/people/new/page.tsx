'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Send, Sparkles, Calendar, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateBigThree } from '@/lib/utils'
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

interface PersonData {
  name?: string
  isRomanticInterest?: boolean
  birthday?: string
  birthTime?: string
  birthLocation?: string
  sunSign?: string
  moonSign?: string
  risingSign?: string
}

export default function NewPersonPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [personData, setPersonData] = useState<PersonData>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [inputMode, setInputMode] = useState<'chat' | 'birthday' | 'birthTime' | 'location'>('chat')
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timer)
    }
  }, [messages, scrollToBottom])

  // Auto-scroll when buttons appear
  useEffect(() => {
    if (inputMode === 'birthTime' && currentStep === 3) {
      const timer = setTimeout(scrollToBottom, 300)
      return () => clearTimeout(timer)
    }
  }, [inputMode, currentStep, scrollToBottom])

  useEffect(() => {
    if (inputMode === 'location' && currentStep === 4) {
      const timer = setTimeout(scrollToBottom, 300)
      return () => clearTimeout(timer)
    }
  }, [inputMode, currentStep, scrollToBottom])

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: "What's their name?",
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
    
    setPersonData(prev => ({ 
      ...prev, 
      birthday
    }))
    
    // Don't immediately proceed - wait for user interaction
  }

  const handleDateConfirm = () => {
    if (!personData.birthday) return
    
    // Convert back to display format
    const date = new Date(personData.birthday)
    const displayDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`
    
    setInputMode('chat')
    addMessage(displayDate, 'user')
    
    setTimeout(() => {
      addMessage(`Do you know their exact time of birth?`, 'assistant')
      setCurrentStep(3)
      setTimeout(() => {
        setInputMode('birthTime')
      }, 1000)
    }, 1000)
  }

  const handleTimeSelect = (time: string) => {
    setPersonData(prev => ({ 
      ...prev, 
      birthTime: time
    }))
    
    // Don't immediately proceed - wait for user interaction
  }

  const handleTimeConfirm = () => {
    if (!personData.birthTime) return
    
    setInputMode('chat')
    addMessage(personData.birthTime, 'user')
    
    setTimeout(() => {
      addMessage(`Do you know their birth location?`, 'assistant')
      setCurrentStep(4)
      setTimeout(() => {
        setInputMode('location')
      }, 1000)
    }, 1000)
  }

  const handleTimeSkip = () => {
    setPersonData(prev => ({ 
      ...prev, 
      birthTime: 'Unknown'
    }))
    
    setInputMode('chat')
    addMessage('Unknown', 'user')
    
    setTimeout(() => {
      addMessage(`Do you know their birth location?`, 'assistant')
      setCurrentStep(4)
      setTimeout(() => {
        setInputMode('location')
      }, 1000)
    }, 1000)
  }

  const handleLocationSelect = (location: string) => {
    setPersonData(prev => ({ 
      ...prev, 
      birthLocation: location
    }))
    
    setInputMode('chat')
    addMessage(location, 'user')
    
    setTimeout(() => {
      addMessage(`Great! I made a profile for ${personData.name}, go check it out!`, 'assistant')
      setCurrentStep(5)
      
      setTimeout(() => {
        savePerson()
      }, 2000)
    }, 1000)
  }

  const processUserResponse = async (userInput: string) => {
    let response = ''
    let nextStep = currentStep

    switch (currentStep) {
      case 0: // Getting name
        setPersonData(prev => ({ ...prev, name: userInput }))
        response = `Is this a romantic interest?`
        nextStep = 1
        break

      case 1: // Getting romantic interest
        const isRomantic = userInput.toLowerCase().includes('yes')
        setPersonData(prev => ({ ...prev, isRomanticInterest: isRomantic }))
        response = `What's their birthday?`
        nextStep = 2
        
        setTimeout(() => {
          setInputMode('birthday')
        }, 1500)
        break

      default:
        response = "Perfect! I've created their profile."
        setTimeout(() => {
          savePerson()
        }, 2000)
        break
    }

    setTimeout(() => {
      addMessage(response, 'assistant')
      setCurrentStep(nextStep)
    }, 1000)
  }

  const handleRomanticResponse = (isRomantic: boolean) => {
    const response = isRomantic ? 'Yes' : 'No'
    addMessage(response, 'user')
    setPersonData(prev => ({ ...prev, isRomanticInterest: isRomantic }))
    
    // Immediately change step to hide buttons
    setCurrentStep(1.5)
    
    setTimeout(() => {
      addMessage(`What's their birthday?`, 'assistant')
      setCurrentStep(2)
      setTimeout(() => {
        setInputMode('birthday')
      }, 1000)
    }, 1000)
  }

  const shouldShowInput = () => {
    return inputMode === 'chat' && (currentStep === 0 || currentStep === 1)
  }

  const shouldShowLocationInput = () => {
    return inputMode === 'location' && currentStep === 4
  }

  const savePerson = async () => {
    if (!user || !personData.name) return
    
    setIsLoading(true)
    
    try {
      // Calculate astrological information if we have enough data
      let astrological_info = {}
      if (personData.birthday) {
        const bigThree = calculateBigThree(
          personData.birthday,
          personData.birthTime || undefined,
          personData.birthLocation || undefined
        )
        
        astrological_info = {
          sun_sign: bigThree.sunSign,
          moon_sign: bigThree.moonSign,
          rising_sign: bigThree.risingSign
        }
      }

      // Prepare personal information
      const personal_info = {
        name: personData.name,
        birth_date: personData.birthday || null,
        birth_time: personData.birthTime || null,
        birth_location: personData.birthLocation || null,
        relationship_type: personData.isRomanticInterest ? 'romantic_interest' : 'friend'
      }

      // Get the correct user ID - use auth user ID directly
      const userId = user.id

      console.log('Saving person with user_id:', userId)
      console.log('Personal info:', personal_info)
      console.log('Astrological info:', astrological_info)

      // Save to people table via API
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          personal_info,
          astrological_info
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Person created successfully:', data.data)
        // Redirect back to main app after successful save
        setTimeout(() => {
          router.push('/app')
        }, 1000)
      } else {
        throw new Error(data.error || 'Failed to save person')
      }
      
    } catch (error) {
      console.error('Error saving person:', error)
      addMessage("There was an error creating their profile. Please try again.", 'assistant')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Add someone new</h1>
          <div className="w-10" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-160px)] px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.role === 'assistant' && (
                    <div className="flex items-start space-x-2">
                      <div className="text-sm text-gray-400">Astra:</div>
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
              
              <AnimatePresence>
                {currentStep === 1 && inputMode === 'chat' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex space-x-4"
                  >
                  <Button 
                    onClick={() => handleRomanticResponse(true)}
                    className="bg-white text-black hover:bg-gray-200 rounded-full px-8 py-3"
                  >
                    Yes
                  </Button>
                  <Button 
                    onClick={() => handleRomanticResponse(false)}
                    className="bg-transparent border border-gray-600 text-white hover:bg-gray-800 rounded-full px-8 py-3"
                  >
                    No
                  </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inline Birthday Selection */}
              {inputMode === 'birthday' && currentStep === 2 && (
                <div className="space-y-4">
                  <InlineDatePicker
                    onDateSelect={handleDateSelect}
                  />
                  <Button 
                    onClick={handleDateConfirm}
                    disabled={!personData.birthday}
                    className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-3 disabled:opacity-50"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Inline Birth Time Selection */}
              {inputMode === 'birthTime' && currentStep === 3 && (
                <div className="space-y-4">
                  <InlineTimePicker
                    onTimeSelect={handleTimeSelect}
                  />
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleTimeConfirm}
                      disabled={!personData.birthTime}
                      className="flex-1 bg-white text-black hover:bg-gray-200 rounded-full py-3 disabled:opacity-50"
                    >
                      Continue
                    </Button>
                    <Button 
                      onClick={handleTimeSkip}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-full py-3"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline Location Selection */}
              {inputMode === 'location' && currentStep === 4 && (
                <InlineLocationSearch
                  onLocationSelect={handleLocationSelect}
                  searchCities={searchCities}
                  placeholder="Search for their birth location..."
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
                placeholder={currentStep === 0 ? 'Their name' : 'Type your response...'}
                className="w-full bg-gray-800 text-white rounded-full pl-4 pr-12 py-3 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 