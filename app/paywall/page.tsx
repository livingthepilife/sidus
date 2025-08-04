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
        // First try localStorage
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

        // Fallback to Supabase
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('astrological_info, basic_info')
          .eq('user_id', authUser.id)
          .single()

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
  }, [authUser])

  const handleStartTrial = async () => {
    if (!authUser) return
    
    setIsLoading(true)
    
    try {
      // Update subscription status to 'trial' in database
      const { error } = await supabase
        .from('user_stats')
        .update({ subscription_status: 'trial' })
        .eq('user_id', authUser.id)

      if (error) {
        console.error('Error updating subscription status:', error)
      }

      // For production, uncomment the line below to use Stripe
      // await createCheckoutSession(authUser?.id)
      
      // For now, simulate loading and redirect to app
      setTimeout(() => {
        router.push('/app')
      }, 2000)
    } catch (error) {
      console.error('Error starting trial:', error)
      setIsLoading(false)
      // Show error message to user
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white overflow-y-auto">
        <div className="min-h-screen flex flex-col justify-center px-6 py-12">
          <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center">
            
            {/* Hero Icon - Simple constellation and hand like Astra */}
            <div className="text-center mb-8">
              <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                {/* Star constellation */}
                <div className="relative">
                  <Star className="w-8 h-8 text-white absolute top-0 left-4" />
                  <div className="w-2 h-2 bg-white rounded-full absolute top-2 right-0" />
                  <div className="w-2 h-2 bg-white rounded-full absolute bottom-4 left-0" />
                  <div className="w-1 h-1 bg-white rounded-full absolute bottom-0 right-2" />
                </div>
                
                {/* Hand underneath */}
                <div className="mt-8">
                  <svg 
                    className="w-12 h-12 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5}
                      d="M7 11.5V14m0-2.5v-5a1.5 1.5 0 113 0m-3 5a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V9a1.5 1.5 0 013 0v5"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl font-bold text-center mb-8 leading-tight">
              {loadingUserData ? (
                "Discover your Soulmate"
              ) : userData ? (
                `Welcome, ${userData.name}!`
              ) : (
                "Discover your Soulmate"
              )}
            </h1>

            {/* Simple Astrological Info - No box, just icons */}
            {!loadingUserData && userData && (
              <div className="flex items-center justify-center space-x-8 mb-8">
                <div className="flex items-center space-x-2">
                  <Sun className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">{userData.zodiacSign}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Moon className="w-5 h-5 text-gray-400" />
                  <span className="text-white font-medium">{userData.moonSign}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-gray-400 transform rotate-45" />
                  <span className="text-white font-medium">{userData.risingSign}</span>
                </div>
              </div>
            )}

            {/* Value Proposition - Simple and lighter */}
            <div className="space-y-6 mb-12 text-center">
              <p className="text-lg leading-relaxed text-gray-300">
                Sidus is your guide to your life and the universe. Whether it's finding your soulmate, working through life challenges, or becoming the best version of yourself, Sidus can show you the way.
              </p>
              
              <p className="text-lg leading-relaxed text-gray-300">
                Millions of people like you have found clarity, peace, and purpose from Sidus's personalized astrological guidance.
              </p>
              
              <p className="text-lg leading-relaxed text-gray-300">
                You can meet Sidus through our free trial. You can cancel anytime, no questions asked, so if Sidus is not for you, it is completely free.
              </p>
            </div>

            {/* Team Signature */}
            <div className="text-center mb-12">
              <p className="text-xl font-script italic text-gray-400 mb-2">
                The Sidus Team
              </p>
              <Star className="w-5 h-5 mx-auto text-white" />
            </div>

            {/* Notification Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className="text-white">
                Notify me before my trial ends
              </span>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
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

            {/* CTA Button - Simple like Astra */}
            <button
              className="w-full bg-white text-black rounded-full py-4 px-6 font-semibold text-lg transition-opacity duration-300 disabled:opacity-70 mb-4"
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
            <p className="text-center text-gray-400 text-sm mb-8">
              {STRIPE_PRICING.weekly.trialDays}-day free trial, then {formatPrice(STRIPE_PRICING.weekly.price)} per week
            </p>

          </div>

          {/* Footer Links */}
          <div className="px-6 py-6 flex justify-center space-x-8 text-sm text-gray-500">
            <button className="hover:text-gray-300 transition-colors">Terms</button>
            <button className="hover:text-gray-300 transition-colors">Privacy</button>
            <button className="hover:text-gray-300 transition-colors">Restore</button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}