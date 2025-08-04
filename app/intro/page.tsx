'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

const animatedMessages = [
  "Sidus is designed to change your life.",
  "Turn on notifications to enable the most full app experience.",
  "Discover your cosmic connections through advanced astrological insights.",
  "Generate your perfect soulmate based on celestial compatibility.",
  "Get personalized guidance for relationships, career, and life decisions.",
  "Your journey through the stars begins now."
]

export default function IntroPage() {
  const router = useRouter()
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const showMessage = (index: number) => {
      if (index >= animatedMessages.length) {
        setIsComplete(true)
        // Auto-redirect to main app after showing all messages
        setTimeout(() => {
          router.push('/app')
        }, 2000)
        return
      }
      
      setCurrentMessageIndex(index)
      
      // Show each message for 3 seconds before transitioning to next
      setTimeout(() => {
        showMessage(index + 1)
      }, 3000)
    }
    
    // Start with first message after a brief delay
    setTimeout(() => {
      showMessage(0)
    }, 1000)
  }, [router])

  const handleSkip = () => {
    router.push('/app')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative">
        {/* Skip button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          onClick={handleSkip}
          className="absolute top-8 right-6 text-gray-400 hover:text-white transition-colors"
        >
          Skip
        </motion.button>

        {/* Cosmic animation background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-32 h-32 text-purple-500/20" />
          </motion.div>
          
          {/* Floating particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              className="absolute w-2 h-2 bg-purple-400 rounded-full"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${30 + (i * 5)}%`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <div className="relative z-10 text-center max-w-md">
          <AnimatePresence mode="wait">
            {!isComplete && (
              <motion.div
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="space-y-8"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                >
                  <h1 className="text-3xl font-bold leading-tight">
                    {animatedMessages[currentMessageIndex]}
                  </h1>
                </motion.div>

                {/* Progress indicator */}
                <div className="flex justify-center space-x-2 mt-12">
                  {animatedMessages.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentMessageIndex 
                          ? 'bg-white' 
                          : index < currentMessageIndex 
                            ? 'bg-purple-500' 
                            : 'bg-gray-600'
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ 
                        scale: index === currentMessageIndex ? 1.2 : 0.8,
                        opacity: index === currentMessageIndex ? 1 : 0.6
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 mx-auto mb-6">
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Sparkles className="w-full h-full text-purple-400" />
                  </motion.div>
                </div>
                
                <h1 className="text-2xl font-bold text-white">
                  Welcome to your cosmic journey!
                </h1>
                
                <p className="text-gray-400">
                  Redirecting you to the app...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
      </div>
    </ProtectedRoute>
  )
}