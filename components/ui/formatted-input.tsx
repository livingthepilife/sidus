'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, MapPin, Search } from 'lucide-react'

interface FormattedDateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function FormattedDateInput({ value, onChange, placeholder = "MM/DD/YYYY" }: FormattedDateInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/\D/g, '') // Remove non-digits
    
    // Format as MM/DD/YYYY
    if (inputValue.length >= 2) {
      inputValue = inputValue.substring(0, 2) + '/' + inputValue.substring(2)
    }
    if (inputValue.length >= 5) {
      inputValue = inputValue.substring(0, 5) + '/' + inputValue.substring(5, 9)
    }
    
    setDisplayValue(inputValue)
    
    // Only call onChange when we have a complete date
    if (inputValue.length === 10) {
      onChange(inputValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-gray-400 text-sm">
        <Calendar className="w-4 h-4" />
        <span>Birth Date</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={10}
          className="w-full bg-gray-800 text-white rounded-lg p-4 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none text-lg font-mono"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          MM/DD/YYYY
        </div>
      </div>
    </div>
  )
}

interface FormattedTimeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function FormattedTimeInput({ value, onChange, placeholder = "HH:MM AM/PM" }: FormattedTimeInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    setDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^\d:APMapm\s]/g, '') // Allow digits, colon, AM/PM, space
    
    setDisplayValue(inputValue)
    onChange(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Auto-add colon after 2 digits
    if (e.key >= '0' && e.key <= '9' && displayValue.length === 2 && !displayValue.includes(':')) {
      setDisplayValue(displayValue + ':')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-gray-400 text-sm">
        <Clock className="w-4 h-4" />
        <span>Birth Time</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white rounded-lg p-4 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none text-lg"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          12:00 AM
        </div>
      </div>
    </div>
  )
}

interface LocationSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (location: string) => void
  searchCities: (query: string) => Promise<string[]>
}

export function LocationSearchPopup({ isOpen, onClose, onSelect, searchCities }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchCities(query)
        setSuggestions(results)
      } catch (error) {
        console.error('Error searching cities:', error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, searchCities])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-white text-lg font-semibold">
            <MapPin className="w-5 h-5" />
            <span>Birth Location</span>
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for city..."
              className="w-full bg-gray-800 text-white rounded-lg pl-11 pr-4 py-3 border border-gray-700 placeholder-gray-400 focus:border-gray-500 outline-none"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="text-center text-gray-400 py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onSelect(suggestion)
                    onClose()
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => {
                onSelect('Unknown')
                onClose()
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-3 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 