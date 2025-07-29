'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

// Scroll wheel component
interface ScrollWheelProps {
  items: (string | number)[]
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
  height?: number
  itemHeight?: number
}

const ScrollWheel: React.FC<ScrollWheelProps> = ({
  items,
  selectedIndex,
  onSelectedIndexChange,
  height = 180,
  itemHeight = 36
}) => {
  const wheelRef = useRef<HTMLDivElement>(null)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    const newIndex = Math.round(scrollTop / itemHeight)
    if (newIndex !== selectedIndex && newIndex >= 0 && newIndex < items.length) {
      onSelectedIndexChange(newIndex)
    }
  }

  useEffect(() => {
    if (wheelRef.current) {
      wheelRef.current.scrollTop = selectedIndex * itemHeight
    }
  }, [selectedIndex, itemHeight])

  return (
    <div
      ref={wheelRef}
      className="overflow-y-scroll scrollbar-hide relative"
      style={{ height: `${height}px` }}
      onScroll={handleScroll}
    >
      {/* Top and bottom padding to center the selected item */}
      <div style={{ height: `${(height - itemHeight) / 2}px` }} />
      
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-center justify-center transition-all duration-200 ${
            index === selectedIndex 
              ? 'text-white text-xl font-semibold' 
              : 'text-gray-500 text-lg'
          }`}
          style={{ height: `${itemHeight}px` }}
          onClick={() => onSelectedIndexChange(index)}
        >
          {item}
        </div>
      ))}
      
      <div style={{ height: `${(height - itemHeight) / 2}px` }} />
      
      {/* Selection indicator lines */}
      <div 
        className="absolute left-0 right-0 border-t border-gray-600 pointer-events-none"
        style={{ top: `${(height - itemHeight) / 2}px` }}
      />
      <div 
        className="absolute left-0 right-0 border-b border-gray-600 pointer-events-none"
        style={{ top: `${(height + itemHeight) / 2}px` }}
      />
    </div>
  )
}

// iOS Date Picker Component
interface IOSDatePickerProps {
  isOpen: boolean
  onClose: () => void
  onDateSelect: (date: string) => void
  initialDate?: string
  title?: string
}

export const IOSDatePicker: React.FC<IOSDatePickerProps> = ({
  isOpen,
  onClose,
  onDateSelect,
  initialDate,
  title = "Select Date"
}) => {
  const currentYear = new Date().getFullYear()
  const currentDate = new Date()
  
  // Initialize with current date or provided initial date
  const initDate = initialDate ? new Date(initialDate) : currentDate
  
  const [selectedMonth, setSelectedMonth] = useState(initDate.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(initDate.getDate())
  const [selectedYear, setSelectedYear] = useState(initDate.getFullYear())

  // Generate arrays for the scroll wheels
  const months = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1))
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i).reverse()
  
  // Smart days array based on selected month and year
  const getDaysArray = (): number[] => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }

  const [days, setDays] = useState<number[]>(getDaysArray())

  // Update days when month or year changes
  useEffect(() => {
    const newDays = getDaysArray()
    setDays(newDays)
    
    // If current selected day is invalid for new month, adjust it
    if (selectedDay > newDays.length) {
      setSelectedDay(newDays.length)
    }
  }, [selectedMonth, selectedYear])

  // Validate that the selected date is not in the future
  const isValidDate = (): boolean => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay)
    return selectedDate <= currentDate
  }

  const handleConfirm = () => {
    if (isValidDate()) {
      // Format as MM/DD/YYYY
      const formattedDate = `${selectedMonth.toString().padStart(2, '0')}/${selectedDay.toString().padStart(2, '0')}/${selectedYear}`
      onDateSelect(formattedDate)
      onClose()
    }
  }

  const selectedMonthIndex = selectedMonth - 1
  const selectedDayIndex = selectedDay - 1
  const selectedYearIndex = years.indexOf(selectedYear)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Picker Modal */}
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <button
                onClick={onClose}
                className="text-purple-400 text-lg"
              >
                Cancel
              </button>
              <h3 className="text-white text-lg font-semibold">{title}</h3>
              <button
                onClick={handleConfirm}
                disabled={!isValidDate()}
                className={`text-lg font-semibold ${
                  isValidDate() ? 'text-purple-400' : 'text-gray-600'
                }`}
              >
                Done
              </button>
            </div>

            {/* Date Wheels */}
            <div className="flex items-center justify-center p-4">
              <div className="flex space-x-4">
                {/* Month Wheel */}
                <div className="flex-1 min-w-0">
                  <ScrollWheel
                    items={months}
                    selectedIndex={selectedMonthIndex}
                    onSelectedIndexChange={(index) => setSelectedMonth(index + 1)}
                  />
                </div>
                
                {/* Day Wheel */}
                <div className="flex-1 min-w-0">
                  <ScrollWheel
                    items={days}
                    selectedIndex={selectedDayIndex}
                    onSelectedIndexChange={(index) => setSelectedDay(index + 1)}
                  />
                </div>
                
                {/* Year Wheel */}
                <div className="flex-1 min-w-0">
                  <ScrollWheel
                    items={years}
                    selectedIndex={selectedYearIndex}
                    onSelectedIndexChange={(index) => setSelectedYear(years[index])}
                  />
                </div>
              </div>
            </div>

            {!isValidDate() && (
              <div className="px-4 pb-4">
                <p className="text-red-400 text-sm text-center">
                  Selected date cannot be in the future
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// iOS Time Picker Component
interface IOSTimePickerProps {
  isOpen: boolean
  onClose: () => void
  onTimeSelect: (time: string) => void
  initialTime?: string
  title?: string
}

export const IOSTimePicker: React.FC<IOSTimePickerProps> = ({
  isOpen,
  onClose,
  onTimeSelect,
  initialTime,
  title = "Select Time"
}) => {
  // Parse initial time or default to 12:00 AM
  const parseTime = (timeStr?: string) => {
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
  }

  const initialParsed = parseTime(initialTime)
  const [selectedHour, setSelectedHour] = useState(initialParsed.hour)
  const [selectedMinute, setSelectedMinute] = useState(initialParsed.minute)
  const [selectedPeriod, setSelectedPeriod] = useState(initialParsed.period)

  // Generate arrays for the scroll wheels
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  const periods = ['AM', 'PM']

  const handleConfirm = () => {
    const formattedTime = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`
    onTimeSelect(formattedTime)
    onClose()
  }

  const selectedHourIndex = selectedHour - 1
  const selectedMinuteIndex = selectedMinute
  const selectedPeriodIndex = selectedPeriod === 'AM' ? 0 : 1

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          
          {/* Picker Modal */}
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <button
                onClick={onClose}
                className="text-purple-400 text-lg"
              >
                Cancel
              </button>
              <h3 className="text-white text-lg font-semibold">{title}</h3>
              <button
                onClick={handleConfirm}
                className="text-purple-400 text-lg font-semibold"
              >
                Done
              </button>
            </div>

            {/* Time Wheels */}
            <div className="flex items-center justify-center p-4">
              <div className="flex space-x-2">
                {/* Hour Wheel */}
                <div className="w-16">
                  <ScrollWheel
                    items={hours}
                    selectedIndex={selectedHourIndex}
                    onSelectedIndexChange={(index) => setSelectedHour(index + 1)}
                  />
                </div>
                
                {/* Separator */}
                <div className="flex items-center justify-center" style={{ height: '180px' }}>
                  <span className="text-white text-xl font-bold">:</span>
                </div>
                
                {/* Minute Wheel */}
                <div className="w-16">
                  <ScrollWheel
                    items={minutes}
                    selectedIndex={selectedMinuteIndex}
                    onSelectedIndexChange={(index) => setSelectedMinute(index)}
                  />
                </div>
                
                {/* Period Wheel */}
                <div className="w-16 ml-4">
                  <ScrollWheel
                    items={periods}
                    selectedIndex={selectedPeriodIndex}
                    onSelectedIndexChange={(index) => setSelectedPeriod(periods[index])}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 