'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!loading && !user && !redirecting) {
      setRedirecting(true)
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo, redirecting])

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute loading timeout - forcing redirect')
        setRedirecting(true)
        router.push(redirectTo)
      }
    }, 8000) // 8 second timeout

    return () => clearTimeout(timeout)
  }, [loading, router, redirectTo])

  if (loading && !redirecting) {
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
          <h1 className="text-xl font-semibold text-white mb-2">Loading...</h1>
          <p className="text-gray-400">Please wait while we verify your session</p>
        </motion.div>
      </div>
    )
  }

  if (!user || redirecting) {
    return null // Will redirect via useEffect
  }

  return <>{children}</>
} 