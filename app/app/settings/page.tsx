'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Calendar, MapPin, LogOut, CreditCard, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface User {
  userId: string
  name: string
  birthday: string
  birthLocation: string
  zodiacSign: string
  onboardingCompleted: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('sidusUser')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setEditedUser(parsedUser)
    } else {
      router.push('/')
    }
  }, [router])

  const handleSave = () => {
    if (editedUser) {
      localStorage.setItem('sidusUser', JSON.stringify(editedUser))
      setUser(editedUser)
      setIsEditing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sidusUser')
    router.push('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="w-full border-b border-gray-800/50 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-2xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-400" />
                <span>Profile Information</span>
              </h2>
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => {
                  if (isEditing) {
                    handleSave()
                  } else {
                    setIsEditing(true)
                  }
                }}
                className="text-sm"
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <p className="text-purple-300 font-medium">{user.zodiacSign}</p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedUser?.name || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-white bg-gray-800/50 p-3 rounded-lg">{user.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Birthday
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedUser?.birthday || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, birthday: e.target.value} : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-white bg-gray-800/50 p-3 rounded-lg">{formatDate(user.birthday)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Birth Location
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedUser?.birthLocation || ''}
                      onChange={(e) => setEditedUser(prev => prev ? {...prev, birthLocation: e.target.value} : null)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  ) : (
                    <p className="text-white bg-gray-800/50 p-3 rounded-lg">{user.birthLocation}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold text-white flex items-center space-x-2 mb-6">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span>Subscription</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">Current Plan</p>
                  <p className="text-sm text-gray-400">Free Trial</p>
                </div>
                <Button variant="outline" className="text-sm">
                  Upgrade
                </Button>
              </div>
              
              <div className="text-sm text-gray-400">
                <p>• Unlimited cosmic guidance</p>
                <p>• Daily horoscopes</p>
                <p>• Soulmate generation</p>
                <p>• Compatibility analysis</p>
              </div>
            </div>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-2xl p-6 border border-gray-700/50"
          >
            <h2 className="text-xl font-bold text-white flex items-center space-x-2 mb-6">
              <Bell className="w-5 h-5 text-purple-400" />
              <span>Notifications</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Daily Horoscope</p>
                  <p className="text-sm text-gray-400">Get your daily cosmic guidance</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-purple-600" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Cosmic Events</p>
                  <p className="text-sm text-gray-400">Important astrological events</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-purple-600" defaultChecked />
              </div>
            </div>
          </motion.div>

          {/* Logout Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full py-4 text-lg font-semibold flex items-center justify-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 