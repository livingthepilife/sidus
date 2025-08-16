'use client'

import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Users, 
  Sparkles, 
  Star,
  Heart,
  Moon,
  Sun,
  Plus,
  MoreVertical,
  Clock,
  LogOut,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { Person } from '@/types'

interface User {
  userId: string
  name: string
  birthday: string
  birthLocation: string
  zodiacSign: string
  moonSign?: string
  risingSign?: string
  onboardingCompleted: boolean
}

interface ChatFeature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  gradient: string
  chatType: string
}

// Component to display a person card
function PersonCard({ person }: { person: Person }) {
  const getRelationshipColor = (type?: string) => {
    switch (type) {
      case 'romantic_interest': return 'from-pink-500 to-rose-600'
      case 'friend': return 'from-blue-500 to-cyan-600'
      case 'family': return 'from-green-500 to-emerald-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRelationshipIcon = (type?: string) => {
    switch (type) {
      case 'romantic_interest': return <Heart className="w-4 h-4" />
      case 'friend': return <Users className="w-4 h-4" />
      case 'family': return <Users className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-2xl p-3 sm:p-4 border border-gray-700/50 shadow-lg"
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${getRelationshipColor(person.personal_info.relationship_type)} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-white font-bold text-sm sm:text-lg">
            {person.personal_info.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm sm:text-base truncate">{person.personal_info.name}</h3>
            {person.personal_info.relationship_type && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                {getRelationshipIcon(person.personal_info.relationship_type)}
                <span className="text-xs text-gray-400 capitalize">
                  {person.personal_info.relationship_type.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          
          {/* Astrological info */}
          {person.astrological_info.sun_sign && (
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <div className="flex items-center space-x-1">
                <Sun className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-300">{person.astrological_info.sun_sign}</span>
              </div>
              {person.astrological_info.moon_sign && (
                <div className="flex items-center space-x-1">
                  <Moon className="w-3 h-3 text-blue-400" />
                  <span className="text-xs text-blue-300">{person.astrological_info.moon_sign}</span>
                </div>
              )}
              {person.astrological_info.rising_sign && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-300">{person.astrological_info.rising_sign}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Birth info */}
          {person.personal_info.birth_date && (
            <div className="mt-1">
              <span className="text-xs text-gray-500 line-clamp-1">
                {new Date(person.personal_info.birth_date).toLocaleDateString()}
                {person.personal_info.birth_location && ` • ${person.personal_info.birth_location}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function MainApp() {
  const router = useRouter()
  const { user: authUser, signOut } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [people, setPeople] = useState<Person[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        setLoadingUser(false)
        return
      }

      try {
        setError(null)
      

        // If no localStorage data, try to get from Supabase user_stats
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          throw new Error('Failed to load user data')
        }

        if (data) {

          // Check subscription status
          if (!data.subscription_status || data.subscription_status === 'none') {
            console.log('User has no active subscription, redirecting to paywall')
            router.push('/paywall')
            return
          }

          if (!data.basic_info.first_name || !data.basic_info.birth_date || !data.astrological_info.sun_sign || !data.astrological_info.moon_sign || !data.astrological_info.rising_sign || !data.basic_info.birth_location ) {
            console.log(
              "User has not completed onboarding, redirecting to onboarding"
            );
            console.log("User data:", data);
            router.push("/onboarding");
            return;
          }

            const userData = {
              userId: data.user_id,
              name: data.basic_info.first_name,
              birthday: data.basic_info.birth_date,
              birthTime: data.basic_info.birth_time,
              birthLocation: data.basic_info.birth_location,
              zodiacSign: data.astrological_info.sun_sign || "Unknown",
              moonSign: data.astrological_info.moon_sign || "Unknown",
              risingSign: data.astrological_info.rising_sign || "Unknown",
              onboardingCompleted: true,
              subscriptionStatus: data.subscription_status,
            };
          console.log('Loaded user data from Supabase user_stats:', userData)
          setUser(userData)
          // Save to localStorage for faster access next time
          localStorage.setItem('sidusUser', JSON.stringify(userData))
        } else {
          // User hasn't completed onboarding
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        setError('Failed to load user data. Please try refreshing the page.')
        // Don't redirect immediately, let user see the error
      } finally {
        setLoadingUser(false)
      }
    }

    loadUserData()
  }, [authUser, router])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingUser) {
        console.warn('User loading timeout - forcing completion')
        setLoadingUser(false)
        setError('Loading timeout. Please refresh the page.')
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeout)
  }, [loadingUser])

  // Load people when user data is available and People tab is active
  useEffect(() => {
    if (authUser && activeTab === 'people') {
      loadPeople()
    }
  }, [authUser, activeTab])

  const loadPeople = async () => {
    if (!authUser) return
    
    setLoadingPeople(true)
    try {
      // Use the auth user ID directly to match what we use when creating people
      const response = await fetch(`/api/people?user_id=${authUser.id}`)
      const data = await response.json()
      
      console.log('Loading people for user_id:', authUser.id)
      console.log('API response:', data)
      
      if (data.success) {
        setPeople(data.data || [])
      } else {
        console.error('Failed to load people:', data.error)
      }
    } catch (error) {
      console.error('Error loading people:', error)
    } finally {
      setLoadingPeople(false)
    }
  }

  const chatFeatures: ChatFeature[] = [
    {
      id: 'general',
      title: 'Ask me anything',
      description: 'Get cosmic guidance on any topic',
      icon: <MessageCircle className="w-6 h-6" />,
      gradient: 'from-purple-500 to-blue-600',
      chatType: 'general'
    },
    {
      id: 'horoscope',
      title: 'Daily horoscope',
      description: 'Your personalized cosmic forecast',
      icon: <Star className="w-6 h-6" />,
      gradient: 'from-green-500 to-teal-600',
      chatType: 'horoscope'
    },
    {
      id: 'compatibility',
      title: 'Romantic compatibility',
      description: 'Explore your cosmic connections',
      icon: <Heart className="w-6 h-6" />,
      gradient: 'from-pink-500 to-rose-600',
      chatType: 'compatibility'
    },
    {
      id: 'soulmate',
      title: 'Your soulmate',
      description: 'Discover your destined partner',
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-orange-500 to-red-600',
      chatType: 'soulmate'
    },
    {
      id: 'friend-compatibility',
      title: 'Friend compatibility',
      description: 'Check compatibility with friends',
      icon: <Users className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-600',
      chatType: 'friend-compatibility'
    },
    {
      id: 'dream-interpreter',
      title: 'Dream interpreter',
      description: 'Understand your dreams',
      icon: <Moon className="w-6 h-6" />,
      gradient: 'from-indigo-500 to-purple-600',
      chatType: 'dream-interpreter'
    },
    {
      id: 'astrological-events',
      title: 'Astrological events',
      description: 'Learn about planetary influences',
      icon: <Sun className="w-6 h-6" />,
      gradient: 'from-yellow-500 to-orange-600',
      chatType: 'astrological-events'
    },
    {
      id: 'tarot-interpreter',
      title: 'Tarot card interpreter',
      description: 'Divine wisdom through tarot',
      icon: <Star className="w-6 h-6" />,
      gradient: 'from-violet-500 to-purple-600',
      chatType: 'tarot-interpreter'
    },
    {
      id: 'personal-growth',
      title: 'Personal growth',
      description: 'Guidance for self-improvement',
      icon: <Sparkles className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-green-600',
      chatType: 'personal-growth'
    }
  ]

  const handleChatFeatureClick = (chatType: string) => {
    router.push(`/app/chat?type=${chatType}`)
  }

  const handleNewPersonClick = () => {
    router.push('/app/people/new')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
          </motion.div>
          <p className="text-gray-400">Loading your cosmic profile...</p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loadingUser) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen cosmic-bg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center animate-spin">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Loading your cosmic profile...</h1>
            <p className="text-gray-400 text-sm">Please wait while we align the stars</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show error state
  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen cosmic-bg flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/onboarding')} 
                className="w-full"
              >
                Go to Onboarding
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show main app
  return (
    <ProtectedRoute>
      <div className="mobile-vh-fix flex flex-col mobile-container">
      {/* Header */}
      <div className="w-full border-b border-gray-800/50 p-4 sm:p-6 flex-shrink-0 mobile-safe-area">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative flex-shrink-0"
            >
              <img 
                src="/assets/images/sidus_logo.png" 
                alt="Sidus" 
                className="h-6 sm:h-8 w-auto filter drop-shadow-lg"
              />
            </motion.div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-400 truncate">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/app/history')}
              className="text-gray-300 hover:text-white hover:bg-gray-800 p-2 sm:px-3 touch-target"
            >
              <Clock className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/app/settings')}
              className="text-gray-300 hover:text-white hover:bg-gray-800 p-2 touch-target"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-300 hover:text-white hover:bg-gray-800 p-2 sm:px-3 touch-target"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0">
        <div className="max-w-full sm:max-w-md mx-auto flex-1 flex flex-col px-4 sm:px-0">
          {/* Tab Navigation */}
          <div className="flex justify-center items-center space-x-12 mt-6 mb-6 flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`p-4 rounded-full transition-all duration-300 touch-target ${
                activeTab === 'chat' 
                  ? 'text-white nav-icon-active' 
                  : 'text-gray-500 hover:text-gray-300 nav-icon-inactive'
              }`}
            >
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`p-4 rounded-full transition-all duration-300 touch-target ${
                activeTab === 'people' 
                  ? 'text-white nav-icon-active' 
                  : 'text-gray-500 hover:text-gray-300 nav-icon-inactive'
              }`}
            >
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>

          {/* Chat Tab Content */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 mobile-scroll overflow-y-auto pb-4 mobile-safe-area">
                <div className="space-y-3 mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="space-y-4">
                      {chatFeatures.map((feature, index) => (
                        <motion.div
                          key={feature.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                          <Button
                            variant="ghost"
                            className="w-full h-auto p-4 sm:p-5 text-left justify-start hover:bg-gray-800/30 border border-gray-800/50 hover:border-purple-500/30 transition-all duration-300 rounded-2xl group touch-target"
                            onClick={() => handleChatFeatureClick(feature.chatType)}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0`}>
                                {feature.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-purple-200 transition-colors duration-300 truncate">{feature.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-400 mt-1 group-hover:text-gray-300 transition-colors duration-300 line-clamp-2">{feature.description}</p>
                              </div>
                              <div className="text-gray-500 group-hover:text-purple-400 transition-colors duration-300 flex-shrink-0">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* People Tab Content */}
          {activeTab === 'people' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 mobile-scroll overflow-y-auto pb-4 mobile-safe-area">
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      People in your life
                    </h2>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto border-dashed border-gray-600/50 hover:border-purple-500/50 bg-transparent hover:bg-gray-800/20 rounded-2xl group transition-all duration-300 touch-target"
                      onClick={handleNewPersonClick}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 py-3 sm:py-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-gray-600 group-hover:border-purple-400 flex items-center justify-center transition-all duration-300 flex-shrink-0">
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-purple-300 transition-colors duration-300" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-gray-300 group-hover:text-white transition-colors duration-300 text-sm sm:text-base">New Person</p>
                          <p className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400 transition-colors duration-300">Add someone to analyze</p>
                        </div>
                      </div>
                    </Button>
                  </motion.div>

                  {/* Current User Profile */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-2xl p-5 border border-gray-700/50 shadow-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">You</h3>
                        <div className="flex items-center flex-wrap gap-3 mt-2">
                          {/* Sun Sign */}
                          <div className="flex items-center space-x-1">
                            <Sun className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-300 font-medium">{user.zodiacSign || 'Loading...'}</span>
                          </div>
                          
                          {/* Moon Sign */}
                          {user.moonSign && user.moonSign !== 'Unknown' && (
                            <div className="flex items-center space-x-1">
                              <Moon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-blue-300 font-medium">{user.moonSign}</span>
                            </div>
                          )}
                          
                          {/* Rising Sign */}
                          {user.risingSign && user.risingSign !== 'Unknown' && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                                <path d="M12 6L14 10L18 10.5L15 13.5L15.5 17.5L12 15.5L8.5 17.5L9 13.5L6 10.5L10 10L12 6Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                              </svg>
                              <span className="text-sm text-purple-300 font-medium">{user.risingSign}</span>
                            </div>
                          )}
                          
                          {/* Show note if missing birth details */}
                          {(user.moonSign === 'Unknown' || user.risingSign === 'Unknown') && (
                            <div className="text-xs text-gray-500 mt-1">
                              Missing birth time/location for complete chart
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <span className="text-sm text-gray-400">{user.birthLocation}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* People List */}
                  {loadingPeople ? (
                    <div className="text-center py-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                      </motion.div>
                      <p className="text-gray-500 text-sm mt-2">Loading people...</p>
                    </div>
                  ) : people.length > 0 ? (
                    <div className="space-y-3">
                      {people.map((person, index) => (
                        <motion.div
                          key={person.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <PersonCard person={person} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Moon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">
                        No people added yet. Add someone to begin analyzing cosmic connections!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
} 