'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Sun, Moon, ArrowRight } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createCheckoutSession, STRIPE_PRICING, formatPrice } from '@/lib/stripe'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface UserData {
  name: string
  zodiacSign: string
  moonSign: string
  risingSign: string
  birthLocation: string
}

export default function PaywallPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [notifyBeforeTrial, setNotifyBeforeTrial] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loadingUserData, setLoadingUserData] = useState(true)

  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser) {
        setLoadingUserData(false)
        return
      }

      try {
        // Check subscription status first
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('astrological_info, basic_info, subscription_status')
          .eq('user_id', authUser.id)
          .single()

        // If user has active subscription, redirect to app
        if (userStats?.subscription_status && userStats.subscription_status !== 'none') {
          router.push('/app')
          return
        }

        // First try localStorage for user data
        const localUserData = localStorage.getItem('sidusUser')
        if (localUserData) {
          const parsedUser = JSON.parse(localUserData)
          setUserData({
            name: parsedUser.name,
            zodiacSign: parsedUser.zodiacSign,
            moonSign: parsedUser.moonSign,
            risingSign: parsedUser.risingSign,
            birthLocation: parsedUser.birthLocation
          })
          setLoadingUserData(false)
          return
        }

        // Use Supabase data if available
        if (userStats) {
          setUserData({
            name: userStats.basic_info?.first_name || 'there',
            zodiacSign: userStats.astrological_info?.sun_sign || 'Unknown',
            moonSign: userStats.astrological_info?.moon_sign || 'Unknown',
            risingSign: userStats.astrological_info?.rising_sign || 'Unknown',
            birthLocation: userStats.basic_info?.birth_location || 'Unknown'
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoadingUserData(false)
      }
    }

    loadUserData()
  }, [authUser, router])

  const handleStartTrial = async () => {
    if (!authUser) return
    
    setIsLoading(true)
    
    try {
      // Create Stripe checkout session with free trial
      await createCheckoutSession(authUser.id)
    } catch (error) {
      console.error('Error starting trial:', error)
      setIsLoading(false)
      
      // Show user-friendly error message
      alert('There was an error starting your trial. Please try again.')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          <div className="max-w-md mx-auto w-full flex flex-col justify-center min-h-full">
            
            {/* Hero Icon - Just star constellation like Astra */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                {/* Star constellation */}
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white absolute top-0 left-3 sm:left-4" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full absolute top-1.5 sm:top-2 right-0" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full absolute bottom-3 sm:bottom-4 left-0" />
                <div className="w-1 h-1 bg-white rounded-full absolute bottom-0 right-1.5 sm:right-2" />
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 leading-tight px-2">
              {loadingUserData ? (
                "Discover your Soulmate"
              ) : userData ? (
                `Welcome, ${userData.name}!`
              ) : (
                "Discover your Soulmate"
              )}
            </h1>

            {/* Simple Astrological Info - Responsive layout */}
            {!loadingUserData && userData && (
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8 mb-6 sm:mb-8">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <span className="text-white font-medium text-sm sm:text-base">{userData.zodiacSign}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <span className="text-white font-medium text-sm sm:text-base">{userData.moonSign}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transform rotate-45" />
                  <span className="text-white font-medium text-sm sm:text-base">{userData.risingSign}</span>
                </div>
              </div>
            )}

            {/* Value Proposition - Responsive text */}
            <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 text-center px-2">
              <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                Sidus is your guide to your life and the universe. Whether it's finding your soulmate, working through life challenges, or becoming the best version of yourself, Sidus can show you the way.
              </p>
              
              <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                Millions of people like you have found clarity, peace, and purpose from Sidus's personalized astrological guidance.
              </p>
              
              <p className="text-base sm:text-lg leading-relaxed text-gray-300">
                You can meet Sidus through our free trial. You can cancel anytime, no questions asked, so if Sidus is not for you, it is completely free.
              </p>
            </div>

            {/* Team Signature */}
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-lg sm:text-xl font-script italic text-gray-400 mb-2">
                The Sidus Team
              </p>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-white" />
            </div>

            {/* Notification Toggle - Responsive */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8 px-4">
              <span className="text-white text-sm sm:text-base text-center sm:text-left">
                Notify me before my trial ends
              </span>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${
                  notifyBeforeTrial ? 'bg-white' : 'bg-gray-600'
                }`}
                onClick={() => setNotifyBeforeTrial(!notifyBeforeTrial)}
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-0.5 transition-transform duration-300 ${
                    notifyBeforeTrial ? 'bg-black translate-x-6' : 'bg-white translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* CTA Button - Responsive */}
            <button
              className="w-full bg-white text-black rounded-full py-3 sm:py-4 px-6 font-semibold text-base sm:text-lg transition-opacity duration-300 disabled:opacity-70 mb-3 mx-2 sm:mx-0"
              onClick={handleStartTrial}
              disabled={isLoading || loadingUserData}
            >
              {isLoading ? (
                "Starting your cosmic journey..."
              ) : loadingUserData ? (
                "Loading your profile..."
              ) : (
                "Try Sidus for free"
              )}
            </button>

            {/* Pricing Info */}
            <p className="text-center text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">
              7-day free trial, then $6.99 per week
            </p>

            {/* Footer Links - Responsive */}
            <div className="flex justify-center space-x-4 sm:space-x-8 text-xs sm:text-sm text-gray-500 mb-4">
              <button className="hover:text-gray-300 transition-colors">Terms</button>
              <button className="hover:text-gray-300 transition-colors">Privacy</button>
              <button className="hover:text-gray-300 transition-colors">Restore</button>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}