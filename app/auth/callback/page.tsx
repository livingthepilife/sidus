'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('error')
          setError(error.message)
          return
        }

        if (data.session) {
          setStatus('success')
          
          // Check user's onboarding and subscription status
          const { data: userStats } = await supabase
            .from('user_stats')
            .select('astrological_info, basic_info, subscription_status')
            .eq('user_id', data.session.user.id)
            .single()

          console.log('User stats:', userStats)

          if (!userStats?.astrological_info || !userStats?.basic_info) {
            // New user - start onboarding which will lead to intro then paywall
            router.push('/onboarding')
          } else if (!userStats?.subscription_status || userStats.subscription_status === 'none') {
            // User completed onboarding but hasn't subscribed - go to paywall
            router.push('/paywall')
          } else {
            // User has active subscription - go to app
            router.push('/app')
          }
        } else {
          // No session, redirect to login
          router.push('/auth/login')
        }
      } catch (err) {
        setStatus('error')
        setError('Something went wrong during authentication')
        console.error('Auth callback error:', err)
      }
    }

    handleAuthCallback()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-xl font-semibold text-white mb-2">Completing sign in...</h1>
          <p className="text-gray-400">Please wait while we verify your account</p>
        </motion.div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-4">Authentication Error</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              Back to Sign In
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
} 