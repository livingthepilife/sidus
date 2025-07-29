'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, X } from 'lucide-react'

// Utility functions for date logic
const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1]
}

const getDaysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate()
}

// Enhanced iOS-style scroll wheel with native-like behavior
interface InlineScrollWheelProps {
  items: (string | number)[]
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
  height?: number
  itemHeight?: number
  width?: string
}

const InlineScrollWheel: React.FC<InlineScrollWheelProps> = ({
  items,
  selectedIndex,
  onSelectedIndexChange,
  height = 216, // Increased height for better iOS feel
  itemHeight = 44, // iOS standard row height
  width = 'flex-1'
}) => {
  const wheelRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const lastScrollTimeRef = useRef<number>(0)

  const scrollToIndex = useCallback((index: number, smooth: boolean = true) => {
    if (wheelRef.current) {
      const scrollTop = index * itemHeight
      if (smooth) {
        wheelRef.current.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        })
      } else {
        wheelRef.current.scrollTop = scrollTop
      }
    }
  }, [itemHeight])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const now = Date.now()
    lastScrollTimeRef.current = now
    
    const scrollTop = e.currentTarget.scrollTop
    const newIndex = Math.round(scrollTop / itemHeight)
    
    if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
      onSelectedIndexChange(newIndex)
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Set timeout to snap to nearest item when scrolling stops - reduced for smoother feel
    scrollTimeoutRef.current = setTimeout(() => {
      // Only snap if enough time has passed since last scroll - reduced threshold
      if (Date.now() - lastScrollTimeRef.current >= 50) {
        const finalIndex = Math.round(scrollTop / itemHeight)
        if (finalIndex >= 0 && finalIndex < items.length) {
          scrollToIndex(finalIndex, true)
        }
      }
    }, 100)
  }, [selectedIndex, items.length, itemHeight, onSelectedIndexChange, scrollToIndex])

  const handleItemClick = useCallback((index: number) => {
    onSelectedIndexChange(index)
    scrollToIndex(index, true)
  }, [onSelectedIndexChange, scrollToIndex])

  // Calculate distance from center for visual effects
  const getItemStyle = useCallback((index: number, currentScrollIndex: number) => {
    const distance = Math.abs(index - currentScrollIndex)
    let opacity = 1
    let scale = 1
    let fontWeight = 400
    
    if (distance === 0) {
      // Selected item - bold and prominent
      opacity = 1
      scale = 1
      fontWeight = 600
    } else if (distance === 1) {
      // Adjacent items - slightly faded
      opacity = 0.6
      scale = 0.95
      fontWeight = 400
    } else if (distance === 2) {
      // Two steps away - more faded
      opacity = 0.3
      scale = 0.9
      fontWeight = 400
    } else {
      // Further away - very faded
      opacity = 0.15
      scale = 0.85
      fontWeight = 400
    }
    
    return {
      opacity,
      transform: `scale(${scale})`,
      fontWeight,
      transition: 'all 0.2s ease-out'
    }
  }, [])

  useEffect(() => {
    scrollToIndex(selectedIndex, false)
  }, [selectedIndex, scrollToIndex])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const visibleItems = 5 // Show 5 items (2 above, 1 center, 2 below)
  const centerIndex = Math.floor(visibleItems / 2)

  return (
    <div className={`relative ${width} flex justify-center`}>
      <div
        ref={wheelRef}
        className="overflow-y-scroll scrollbar-hide relative"
        style={{ 
          height: `${height}px`,
          scrollSnapType: 'y mandatory'
        }}
        onScroll={handleScroll}
      >
        {/* Top padding to center the first item */}
        <div style={{ height: `${centerIndex * itemHeight}px` }} />
        
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-center cursor-pointer select-none"
            style={{
              height: `${itemHeight}px`,
              scrollSnapAlign: 'center',
              ...getItemStyle(index, selectedIndex)
            }}
            onClick={() => handleItemClick(index)}
          >
            <span className="text-white text-lg leading-none">
              {item}
            </span>
          </div>
        ))}
        
        {/* Bottom padding to center the last item */}
        <div style={{ height: `${centerIndex * itemHeight}px` }} />
      </div>
      
      {/* iOS-style selection indicator */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div 
          className="w-full border-t border-b border-gray-500/30"
          style={{ height: `${itemHeight}px` }}
        />
      </div>
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-gray-800/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-800/80 to-transparent pointer-events-none" />
    </div>
  )
}

// Full-screen Location Search Popup
interface LocationSearchPopupProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: string) => void
  searchCities: (query: string) => Promise<string[]>
  placeholder?: string
}

export const LocationSearchPopup: React.FC<LocationSearchPopupProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  searchCities,
  placeholder = "Search for a city..."
}) => {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (value.length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }
    
    setIsSearching(true)
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(value)
        setSuggestions(results)
      } catch (error) {
        console.error('Error searching cities:', error)
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [searchCities])

  const handleSuggestionClick = useCallback((location: string) => {
    onLocationSelect(location)
    onClose()
    setInputValue('')
    setSuggestions([])
  }, [onLocationSelect, onClose])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onLocationSelect(inputValue.trim())
      onClose()
      setInputValue('')
      setSuggestions([])
    }
  }, [inputValue, onLocationSelect, onClose])

  const handleClose = useCallback(() => {
    onLocationSelect('Unknown')
    onClose()
    setInputValue('')
    setSuggestions([])
  }, [onLocationSelect, onClose])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900"
    >
      <div className="h-full flex flex-col">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <h2 className="text-lg font-medium text-white">Search Location</h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full bg-gray-800/80 text-white rounded-xl pl-11 pr-4 py-4 border border-gray-600/50 placeholder-gray-400 focus:border-gray-500/70 outline-none transition-all"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-800/50 transition-colors flex items-center space-x-3 group"
                >
                  <MapPin className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  <span className="text-gray-300 group-hover:text-white transition-colors text-lg">
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          ) : inputValue.length >= 2 && !isSearching ? (
            <div className="p-4 text-center text-gray-500">
              No locations found
            </div>
          ) : inputValue.length < 2 ? (
            <div className="p-4 text-center text-gray-500">
              Start typing to search for locations...
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

// Inline Location Search Component (now just shows Yes/Skip buttons)
interface InlineLocationSearchProps {
  onLocationSelect: (location: string) => void
  searchCities: (query: string) => Promise<string[]>
  placeholder?: string
}

export const InlineLocationSearch: React.FC<InlineLocationSearchProps> = ({
  onLocationSelect,
  searchCities,
  placeholder = "Search for a city..."
}) => {
  const [showPopup, setShowPopup] = useState(false)

  const handleYes = useCallback(() => {
    setShowPopup(true)
  }, [])

  const handleSkip = useCallback(() => {
    onLocationSelect('Unknown')
  }, [onLocationSelect])

  const handleClosePopup = useCallback(() => {
    setShowPopup(false)
  }, [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Yes/Skip buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleYes}
            className="flex-1 bg-white text-black hover:bg-gray-200 rounded-full py-3 px-4 font-medium transition-colors"
          >
            Yes
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 bg-transparent border border-gray-600 text-white hover:bg-gray-800 rounded-full py-3 px-4 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </motion.div>

      {/* Full-screen popup */}
      <LocationSearchPopup
        isOpen={showPopup}
        onClose={handleClosePopup}
        onLocationSelect={onLocationSelect}
        searchCities={searchCities}
        placeholder={placeholder}
      />
    </>
  )
}

// Inline Date Picker Component with iOS styling
interface InlineDatePickerProps {
  onDateSelect: (date: string) => void
  initialDate?: string
}

export const InlineDatePicker: React.FC<InlineDatePickerProps> = ({
  onDateSelect,
  initialDate
}) => {
  const currentYear = new Date().getFullYear()
  const currentDate = useMemo(() => new Date(), [])
  
  const initDate = useMemo(() => 
    initialDate ? new Date(initialDate) : currentDate, 
    [initialDate, currentDate]
  )
  
  const [selectedMonth, setSelectedMonth] = useState(initDate.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(initDate.getDate())
  const [selectedYear, setSelectedYear] = useState(initDate.getFullYear())
  const [lastSubmittedDate, setLastSubmittedDate] = useState<string>('')

  const months = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => getMonthName(i + 1)), 
    []
  )
  const years = useMemo(() => 
    Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i).reverse(), 
    [currentYear]
  )
  
  const getDaysArray = useCallback((): number[] => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [selectedMonth, selectedYear])

  const [days, setDays] = useState<number[]>(() => getDaysArray())

  useEffect(() => {
    const newDays = getDaysArray()
    setDays(newDays)
    
    if (selectedDay > newDays.length) {
      setSelectedDay(newDays.length)
    }
  }, [selectedMonth, selectedYear, selectedDay, getDaysArray])

  useEffect(() => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay)
    if (selectedDate <= currentDate) {
      const formattedDate = `${selectedMonth.toString().padStart(2, '0')}/${selectedDay.toString().padStart(2, '0')}/${selectedYear}`
      
      if (formattedDate !== lastSubmittedDate) {
        setLastSubmittedDate(formattedDate)
        onDateSelect(formattedDate)
      }
    }
  }, [selectedMonth, selectedDay, selectedYear, currentDate, lastSubmittedDate, onDateSelect])

  const selectedMonthIndex = selectedMonth - 1
  const selectedDayIndex = selectedDay - 1
  const selectedYearIndex = years.indexOf(selectedYear)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-center space-x-8">
        {/* Month Wheel */}
        <div className="flex-1 min-w-0">
          <InlineScrollWheel
            items={months}
            selectedIndex={selectedMonthIndex}
            onSelectedIndexChange={(index) => setSelectedMonth(index + 1)}
            width="w-full"
          />
        </div>
        
        {/* Day Wheel */}
        <div className="w-16">
          <InlineScrollWheel
            items={days}
            selectedIndex={selectedDayIndex}
            onSelectedIndexChange={(index) => setSelectedDay(index + 1)}
            width="w-full"
          />
        </div>
        
        {/* Year Wheel */}
        <div className="w-20">
          <InlineScrollWheel
            items={years}
            selectedIndex={selectedYearIndex}
            onSelectedIndexChange={(index) => setSelectedYear(years[index])}
            width="w-full"
          />
        </div>
      </div>
    </motion.div>
  )
}

// Inline Time Picker Component with iOS styling
interface InlineTimePickerProps {
  onTimeSelect: (time: string) => void
  initialTime?: string
}

export const InlineTimePicker: React.FC<InlineTimePickerProps> = ({
  onTimeSelect,
  initialTime
}) => {
  const parseTime = useCallback((timeStr?: string) => {
    if (!timeStr) return { hour: 12, minute: 0, period: 'AM' }
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (match) {
      return {
        hour: parseInt(match[1]),
        minute: parseInt(match[2]),
        period: match[3].toUpperCase()
      }
    }
    return { hour: 12, minute: 0, period: 'AM' }
  }, [])

  const initialParsed = useMemo(() => parseTime(initialTime), [initialTime, parseTime])
  const [selectedHour, setSelectedHour] = useState(initialParsed.hour)
  const [selectedMinute, setSelectedMinute] = useState(initialParsed.minute)
  const [selectedPeriod, setSelectedPeriod] = useState(initialParsed.period)
  const [lastSubmittedTime, setLastSubmittedTime] = useState<string>('')

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')), [])
  const periods = useMemo(() => ['AM', 'PM'], [])

  useEffect(() => {
    const formattedTime = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`
    
    if (formattedTime !== lastSubmittedTime) {
      setLastSubmittedTime(formattedTime)
      onTimeSelect(formattedTime)
    }
  }, [selectedHour, selectedMinute, selectedPeriod, lastSubmittedTime, onTimeSelect])

  const selectedHourIndex = selectedHour - 1
  const selectedMinuteIndex = selectedMinute
  const selectedPeriodIndex = selectedPeriod === 'AM' ? 0 : 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-center space-x-8">
        {/* Hour Wheel */}
        <div className="w-16">
          <InlineScrollWheel
            items={hours}
            selectedIndex={selectedHourIndex}
            onSelectedIndexChange={(index) => setSelectedHour(index + 1)}
            width="w-full"
          />
        </div>
        
        {/* Minute Wheel */}
        <div className="w-16">
          <InlineScrollWheel
            items={minutes}
            selectedIndex={selectedMinuteIndex}
            onSelectedIndexChange={(index) => setSelectedMinute(index)}
            width="w-full"
          />
        </div>
        
        {/* Period Wheel */}
        <div className="w-16">
          <InlineScrollWheel
            items={periods}
            selectedIndex={selectedPeriodIndex}
            onSelectedIndexChange={(index) => setSelectedPeriod(periods[index])}
            width="w-full"
          />
        </div>
      </div>
    </motion.div>
  )
} 