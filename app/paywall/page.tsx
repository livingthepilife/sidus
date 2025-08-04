'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Star, Heart, Users, Zap, Sun, Moon } from 'lucide-react'
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 6 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Main Content */}
          <motion.div 
            className="flex-1 px-6 py-12 max-w-md mx-auto w-full flex flex-col justify-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Hero Icon */}
            <motion.div 
              className="text-center mb-8"
              variants={iconVariants}
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 mx-auto mb-4 relative"
                >
                  {/* Hand with sparkles */}
                  <div className="w-full h-full bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Heart className="w-10 h-10 text-purple-600" />
                    </motion.div>
                  </div>
                  
                  {/* Floating sparkles around the icon */}
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Star className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                  
                  <motion.div
                    animate={{
                      rotate: -360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute -bottom-1 -left-2"
                  >
                    <Sparkles className="w-4 h-4 text-blue-300" />
                  </motion.div>
                  
                  <motion.div
                    animate={{
                      y: [-3, 3, -3],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute top-0 left-0"
                  >
                    <div className="w-2 h-2 bg-pink-300 rounded-full" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Main Heading - Personalized */}
            <motion.h1 
              className="text-4xl font-bold text-center mb-8 leading-tight"
              variants={itemVariants}
            >
              {loadingUserData ? (
                "Discover your Soulmate"
              ) : userData ? (
                `Welcome, ${userData.name}!`
              ) : (
                "Discover your Soulmate"
              )}
            </motion.h1>

            {/* Personalized Astrological Info */}
            {!loadingUserData && userData && (
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 text-center"
                variants={itemVariants}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold mb-4 text-white">Your Cosmic Profile</h3>
                <div className="flex items-center justify-center space-x-6 mb-4">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-5 h-5 text-yellow-300" />
                    <span className="text-white font-medium">{userData.zodiacSign}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Moon className="w-5 h-5 text-blue-300" />
                    <span className="text-white font-medium">{userData.moonSign}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="w-5 h-5 text-green-300 transform rotate-45" />
                    <span className="text-white font-medium">{userData.risingSign}</span>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  Born in {userData.birthLocation}
                </p>
              </motion.div>
            )}

            {/* Value Proposition - Personalized */}
            <motion.div className="space-y-6 mb-8" variants={itemVariants}>
              <p className="text-lg text-center leading-relaxed text-gray-100">
                {!loadingUserData && userData ? (
                  `${userData.name}, your ${userData.zodiacSign} energy is ready for cosmic guidance. Sidus will help you find your soulmate, navigate life's challenges, and unlock your highest potential.`
                ) : (
                  "Sidus is your guide to your life and the universe. Whether it's finding your soulmate, working through life challenges, or becoming the best version of yourself, Sidus can show you the way."
                )}
              </p>
              
              <p className="text-lg text-center leading-relaxed text-gray-100">
                {!loadingUserData && userData ? (
                  `With your unique ${userData.zodiacSign} sun, ${userData.moonSign} moon, and ${userData.risingSign} rising combination, you're destined for extraordinary connections and insights.`
                ) : (
                  "Millions of people like you have found clarity, peace, and purpose from Sidus's personalized astrological guidance."
                )}
              </p>
              
              <p className="text-lg text-center leading-relaxed text-gray-100">
                You can meet Sidus through our free trial. You can cancel anytime, no questions asked, so if Sidus is not for you, it is completely free.
              </p>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              className="grid grid-cols-2 gap-4 mb-8"
              variants={itemVariants}
            >
              {[
                { icon: Heart, text: "AI Soulmate Generation" },
                { icon: Star, text: "Personalized Horoscopes" },
                { icon: Users, text: "Compatibility Analysis" },
                { icon: Zap, text: "Instant Guidance" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ duration: 0.2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <feature.icon className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-sm font-medium">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Team Signature */}
            <motion.div 
              className="text-center mb-8"
              variants={itemVariants}
            >
              <p className="text-xl font-script italic text-gray-200 mb-2">
                The Sidus Team
              </p>
              <Sparkles className="w-5 h-5 mx-auto text-purple-300" />
            </motion.div>

            {/* Notification Toggle */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 flex items-center justify-between"
              variants={itemVariants}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
            >
              <span className="text-white font-medium">
                Notify me before my trial ends
              </span>
              <motion.button
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  notifyBeforeTrial ? 'bg-green-500' : 'bg-gray-600'
                }`}
                onClick={() => setNotifyBeforeTrial(!notifyBeforeTrial)}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300"
                  animate={{
                    x: notifyBeforeTrial ? 26 : 2
                  }}
                />
              </motion.button>
            </motion.div>

            {/* CTA Button */}
            <motion.button
              className="w-full bg-white text-purple-900 rounded-full py-4 px-6 font-bold text-lg flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-70"
              variants={itemVariants}
              whileHover={{ 
                scale: isLoading ? 1 : 1.02, 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
              }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              onClick={handleStartTrial}
              disabled={isLoading || loadingUserData}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Starting your cosmic journey...</span>
                </motion.div>
              ) : loadingUserData ? (
                <span>Loading your profile...</span>
              ) : (
                <>
                  <span>Try Sidus for free</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Pricing Info */}
            <motion.p 
              className="text-center text-gray-300 mt-4 text-sm"
              variants={itemVariants}
            >
              {STRIPE_PRICING.weekly.trialDays}-day free trial, then {formatPrice(STRIPE_PRICING.weekly.price)} per week
            </motion.p>
          </motion.div>

          {/* Footer Links */}
          <motion.div 
            className="px-6 py-6 flex justify-center space-x-8 text-sm text-gray-400"
            variants={itemVariants}
          >
            <button className="hover:text-white transition-colors">Terms</button>
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Restore</button>
          </motion.div>
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 mx-auto mb-4"
                >
                  <Sparkles className="w-full h-full text-purple-600" />
                </motion.div>
                <p className="text-purple-900 font-semibold">Starting your journey...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}