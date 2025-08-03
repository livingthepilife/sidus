'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

interface SoulmateData {
  imageUrl: string
  compatibilityScore: number
  analysis: string
  soulmateSign: string
  sunSign: string
  moonSign: string
  risingSign: string
}

export default function SoulmateGenerationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const genderPreference = searchParams.get('gender') || ''
  const ethnicityPreference = searchParams.get('ethnicity') || ''
  
  const [generationProgress, setGenerationProgress] = useState(0)
  const [soulmateData, setSoulmateData] = useState<SoulmateData | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('sidusUser')
    if (!userData) {
      setError('Please log in to generate your soulmate')
      setIsGenerating(false)
      return
    }

    if (genderPreference && ethnicityPreference && !hasGenerated) {
      setHasGenerated(true)
      generateSoulmate()
    }
  }, [genderPreference, ethnicityPreference, hasGenerated])

  const generateSoulmate = async () => {
    // Prevent multiple simultaneous generations
    if (isGenerating) {
      return
    }
    
    try {
      setIsGenerating(true)
      setError(null)
      setGenerationProgress(0)
      
      // Progress animation - more realistic timing
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          // Slower, more realistic progress
          return prev + Math.random() * 8 + 2
        })
      }, 800)

      // Get user data from localStorage
      const userData = localStorage.getItem('sidusUser')
      console.log('User data from localStorage:', userData)
      if (!userData) {
        throw new Error('User data not found - Please log in')
      }
      const user = JSON.parse(userData)
      console.log('Parsed user data:', user)

            // Call soulmate API to generate everything with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      let data: any
      
      try {
        const response = await fetch('/api/soulmate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            genderPreference,
            racePreference: ethnicityPreference.split(','),
            userSign: user.zodiacSign
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        data = await response.json()
        if (!data.success) {
          console.error('Soulmate API error:', data.error)
          if (data.error?.includes('Unauthorized')) {
            throw new Error('Please log in to generate your soulmate')
          }
          throw new Error(data.error || 'Failed to generate soulmate')
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Soulmate generation timed out. Please try again.')
        }
        throw fetchError
      }

      const { imageUrl, soulmateSign, compatibilityScore, analysis, sunSign, moonSign, risingSign, shortDescription } = data.data

      clearInterval(progressInterval)
      
      setSoulmateData({
        imageUrl,
        compatibilityScore,
        analysis,
        soulmateSign,
        sunSign,
        moonSign,
        risingSign
      })
      
      setIsGenerating(false)
      
      // Show completion message briefly before redirecting
      setTimeout(() => {
        setGenerationProgress(100)
        // Navigate to results page after showing completion message
        setTimeout(() => {
          router.push(`/app/soulmate/result?imageUrl=${encodeURIComponent(imageUrl)}&compatibility=${compatibilityScore}&soulmateSign=${encodeURIComponent(soulmateSign)}&analysis=${encodeURIComponent(analysis)}&sunSign=${encodeURIComponent(sunSign)}&moonSign=${encodeURIComponent(moonSign)}&risingSign=${encodeURIComponent(risingSign)}&shortDescription=${encodeURIComponent(shortDescription)}`)
        }, 1500) // Show completion message for 1.5 seconds
      }, 500) // Brief pause before showing completion
      
    } catch (error) {
      console.error('Error generating soulmate:', error)
      let errorMessage = 'Failed to generate soulmate. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('OPENAI_API_KEY')) {
          errorMessage = 'API configuration error. Please check your OpenAI API key.'
        } else if (error.message.includes('Failed to generate soulmate image')) {
          errorMessage = 'Image generation failed. Please try again.'
        } else if (error.message.includes('Failed to generate soulmate')) {
          errorMessage = 'Soulmate generation failed. Please try again.'
        }
      }
      
      setError(errorMessage)
      setIsGenerating(false)
    }
  }

  const handleBack = () => {
    router.push('/app/chat?type=soulmate')
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
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8 max-w-md"
            >
              {/* Animated Star */}
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 mx-auto mb-6"
                >
                  <Sparkles className="w-full h-full text-purple-400" />
                </motion.div>
                
                {/* Floating dots */}
                <motion.div
                  animate={{ 
                    y: [-10, 10, -10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-4 right-8 w-2 h-2 bg-purple-400 rounded-full"
                />
                <motion.div
                  animate={{ 
                    y: [10, -10, 10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute bottom-4 left-8 w-2 h-2 bg-blue-400 rounded-full"
                />
              </div>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Divining Your Soulmate...
                </h2>
                <p className="text-gray-400 text-sm">
                  The universe is aligning the perfect cosmic match for you
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Status Messages */}
              <div className="space-y-2">
                {generationProgress < 20 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Consulting the cosmic forces...
                  </motion.p>
                )}
                {generationProgress >= 20 && generationProgress < 40 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Analyzing astrological compatibility...
                  </motion.p>
                )}
                {generationProgress >= 40 && generationProgress < 60 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Calculating cosmic connections...
                  </motion.p>
                )}
                {generationProgress >= 60 && generationProgress < 80 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Manifesting your soulmate's image...
                  </motion.p>
                )}
                {generationProgress >= 80 && generationProgress < 95 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Finalizing your cosmic match...
                  </motion.p>
                )}
                {generationProgress >= 95 && generationProgress < 100 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-purple-400 text-sm"
                  >
                    Preparing your soulmate's reveal...
                  </motion.p>
                )}
                {generationProgress === 100 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-green-400 text-sm font-semibold"
                  >
                    Your soulmate has been revealed! ✨
                  </motion.p>
                )}
              </div>
            </motion.div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="text-red-400 text-lg">{error}</div>
              <button
                onClick={generateSoulmate}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-green-400 text-lg">Generation Complete!</div>
              <p className="text-gray-400">Redirecting to your soulmate...</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
} 