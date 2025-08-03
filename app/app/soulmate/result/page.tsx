'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, MoreVertical, ArrowRight, Heart, Star, Moon } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SoulmateResultPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const imageUrl = searchParams.get('imageUrl') || ''
  const compatibility = searchParams.get('compatibility') || '95'
  const soulmateSign = searchParams.get('soulmateSign') || 'Aries'
  const analysis = searchParams.get('analysis') || ''
  const sunSign = searchParams.get('sunSign') || 'Aries'
  const moonSign = searchParams.get('moonSign') || 'Aries'
  const risingSign = searchParams.get('risingSign') || 'Scorpio'
  const shortDescription = searchParams.get('shortDescription') || ''

  const [showMenu, setShowMenu] = useState(false)

  const handleBack = () => {
    router.push('/app/chat?type=soulmate')
  }

  const handleReset = async () => {
    setShowMenu(false)
    
    // Delete the current soulmate from database
    try {
      const response = await fetch('/api/soulmates', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Redirect to soulmate generation
        router.push('/app/chat?type=soulmate')
      } else {
        console.error('Failed to delete soulmate')
        // Still redirect even if deletion fails
        router.push('/app/chat?type=soulmate')
      }
    } catch (error) {
      console.error('Error deleting soulmate:', error)
      // Still redirect even if deletion fails
      router.push('/app/chat?type=soulmate')
    }
  }

  const handleLearnMore = () => {
    // Create a preset person for compatibility check
    const soulmatePerson = {
      name: "Your Soulmate",
      birthDate: "1995-03-21", // Example date
      birthTime: "12:00",
      birthLocation: "New York, NY",
      sunSign: sunSign,
      moonSign: moonSign,
      risingSign: risingSign,
      relationshipType: "soulmate"
    }

    // Store the soulmate data for compatibility check
    localStorage.setItem('soulmateForCompatibility', JSON.stringify(soulmatePerson))
    
    // Navigate to compatibility check
    router.push('/app/chat?type=compatibility&preset=soulmate')
  }

  const generateShortCompatibilityDescription = () => {
    // Get user's zodiac sign from localStorage
    const userData = localStorage.getItem('sidusUser')
    const userSign = userData ? JSON.parse(userData).zodiacSign : 'Aquarius'
    
    // Generate a short, spicy description based on the signs
    const descriptions = [
      `Your ${userSign} passion meets their fiery ${sunSign} spirit, igniting thrilling adventures, while your shared ${risingSign} rising fosters an intense emotional bond, creating an unbreakable connection.`,
      `The cosmic dance between ${userSign} and ${sunSign} creates a magnetic attraction that transcends the ordinary, with your ${moonSign} moon adding depth to every moment shared.`,
      `Your ${userSign} energy harmonizes perfectly with their ${sunSign} nature, creating a love story written in the stars, while your ${risingSign} rising ensures a connection that grows stronger with time.`,
      `The universe has aligned ${userSign} and ${sunSign} in perfect harmony, with your ${moonSign} moon adding emotional depth to a relationship destined for greatness.`,
      `Your ${userSign} soul finds its perfect match in their ${sunSign} spirit, creating a bond that's both passionate and profound, with your ${risingSign} rising ensuring lasting compatibility.`
    ]
    
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Your Soulmate</h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48"
              >
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors rounded-lg"
                >
                  Generate New Soulmate
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 pb-24 space-y-6 flex flex-col items-center justify-center">
          {/* Soulmate Image - Square and Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
              <img
                src={imageUrl}
                alt="Your Soulmate"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/400x400/1f2937/ffffff?text=Your+Soulmate'
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Compatibility Badge */}
              <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                {compatibility}% Compatible
              </div>
            </div>
          </motion.div>

          {/* Compatibility Percentage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <div className="text-3xl font-bold text-white mb-6">
              {compatibility}% compatible
            </div>
          </motion.div>

          {/* Astrological Signs with Icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center space-x-8 sm:space-x-12"
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-gray-400">Sun</div>
              <div className="font-medium text-white">{sunSign}</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.319a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-1.667-3.93L15 5.323V7a1 1 0 11-2 0V2z" />
                </svg>
              </div>
              <div className="text-sm text-gray-400">Moon</div>
              <div className="font-medium text-white">{moonSign}</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm text-gray-400">Rising</div>
              <div className="font-medium text-white">{risingSign}</div>
            </div>
          </motion.div>

          {/* Short Compatibility Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center max-w-md mx-auto"
          >
            <p className="text-gray-300 leading-relaxed text-sm">
              {shortDescription || generateShortCompatibilityDescription()}
            </p>
          </motion.div>
        </div>

        {/* Bottom Action - Fixed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-black"
        >
          <button
            onClick={handleLearnMore}
            className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-4 text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <span>Tap to learn more</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </ProtectedRoute>
  )
} 