'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Star, Moon, Sun, MessageCircle, Heart, Users, LogOut, User, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function LandingPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()

  const handleBeginOnboarding = () => {
    router.push('/onboarding')
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/app')
    } else {
      router.push('/auth/signup')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/assets/images/sidus_logo.png" 
              alt="Sidus" 
              className="h-8 w-auto filter drop-shadow-lg"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300 text-sm">
                  Welcome back, {user.email?.split('@')[0]}
                </span>
                <Button
                  onClick={() => router.push('/app')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  onClick={() => router.push('/app/settings')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-white hover:bg-gray-100 text-black">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative pt-24">
        <div className="max-w-4xl w-full text-center space-y-8">
          
          {/* Logo and Title */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/assets/images/sidus_logo.png" 
                alt="Sidus" 
                className="h-12 w-auto filter drop-shadow-lg"
              />
            </div>
            
            <div className="text-sm text-gray-400 uppercase tracking-widest mb-4">
              Your Astrology Companion and Soulmate Guide
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              The universe is listening.
              <br />
              <span className="text-gray-300">Ask away</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              The Sidus app knows the whispers of the cosmos.
              <br />
              Whatever's on your mind, just ask.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={handleGetStarted}
              className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {user ? 'Enter Dashboard' : 'Begin Your Journey'}
            </Button>
          </motion.div>
        </div>

        {/* Floating cosmic elements */}
        <motion.div
          className="absolute top-20 left-10"
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-white opacity-30" />
        </motion.div>
        <motion.div
          className="absolute top-32 right-16"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Star className="w-4 h-4 text-white opacity-40" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 left-20"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Moon className="w-5 h-5 text-white opacity-25" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Feature 1 - Ask Anything */}
          <motion.div
            className="mb-32"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-6xl font-bold text-white opacity-10">01</div>
                <h2 className="text-4xl font-bold text-white">
                  The universe is listening. Ask away
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Whatever's on your mind, just ask. Sidus can answer any of your questions and provide you with guidance based on your unique astrological blueprint.
                </p>
              </div>
              <div className="relative">
                {/* Mock phone interface */}
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700 shadow-2xl">
                  <div className="bg-black rounded-2xl p-4 space-y-4 h-96">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white font-medium">Cosmic Chat</span>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-gray-800 rounded-2xl p-3 max-w-xs">
                        <p className="text-gray-200 text-sm">What does my birth chart say about my career path?</p>
                      </div>
                      <div className="bg-purple-600 rounded-2xl p-3 max-w-xs ml-auto">
                        <p className="text-white text-sm">Based on your Leo sun and Virgo rising, you're destined for leadership roles that combine creativity with precision...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature 2 - Soulmate Discovery */}
          <motion.div
            className="mb-32"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 md:order-1">
                {/* Mock soulmate interface */}
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700 shadow-2xl">
                  <div className="bg-black rounded-2xl p-4 space-y-4 h-96">
                    <div className="text-center space-y-4">
                      <Heart className="w-12 h-12 text-pink-500 mx-auto" />
                      <h3 className="text-white font-bold">Your Cosmic Soulmate</h3>
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4">
                        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3"></div>
                        <p className="text-white text-sm font-medium">Sarah, 28</p>
                        <p className="text-pink-200 text-xs">Libra • Artist • 94% Match</p>
                      </div>
                      <div className="text-gray-400 text-xs">
                        "Your Venus in Taurus perfectly complements their Sun in Libra..."
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 order-1 md:order-2">
                <div className="text-6xl font-bold text-white opacity-10">02</div>
                <h2 className="text-4xl font-bold text-white">
                  Cosmic connections, reimagined
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Discover your destined partner through the stars. Our AI analyzes cosmic compatibility to reveal your perfect soulmate match based on astrological alignment.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature 3 - Compatibility */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="text-6xl font-bold text-white opacity-10">03</div>
                <h2 className="text-4xl font-bold text-white">
                  Align your stars, connect hearts
                </h2>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Compare birth charts with friends, family, or romantic interests. See what fate has in store and discover if you're destined for friendship or romance.
                </p>
              </div>
              <div className="relative">
                {/* Mock compatibility interface */}
                <div className="bg-gray-900 rounded-3xl p-6 border border-gray-700 shadow-2xl">
                  <div className="bg-black rounded-2xl p-4 space-y-4 h-96">
                    <div className="text-center space-y-4">
                      <Users className="w-8 h-8 text-blue-500 mx-auto" />
                      <h3 className="text-white font-medium">Compatibility Analysis</h3>
                      <div className="flex items-center justify-center space-x-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full mb-2 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">You</span>
                          </div>
                          <p className="text-gray-400 text-xs">Leo</p>
                        </div>
                        <div className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded"></div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full mb-2 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Alex</span>
                          </div>
                          <p className="text-gray-400 text-xs">Sagittarius</p>
                        </div>
                      </div>
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                        <div className="text-green-400 font-bold text-2xl">87%</div>
                        <div className="text-green-300 text-xs">Highly Compatible</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <motion.div
          className="max-w-2xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="space-y-4">
            <Sparkles className="w-8 h-8 text-white mx-auto opacity-60" />
            <h2 className="text-3xl font-bold text-white">Ready to discover your cosmic destiny?</h2>
            <p className="text-gray-400">Join millions who have found clarity through celestial guidance</p>
          </div>
          
          <Button
            onClick={handleGetStarted}
            className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {user ? 'Enter Dashboard' : 'Begin Your Cosmic Journey'}
          </Button>
        </motion.div>
      </section>
    </div>
  )
} 