import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ZodiacSign, ZODIAC_SIGNS } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getZodiacSign(birthday: string): ZodiacSign {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// Moon sign calculation (simplified - based on birth date and time)
export function getMoonSign(birthday: string, birthTime?: string): ZodiacSign {
  const date = new Date(birthday);
  let hour = 12; // Default to noon if no time provided
  
  if (birthTime && birthTime !== 'Unknown') {
    // Handle both "12:00 AM" and "12:00" formats
    try {
      if (birthTime.includes('AM') || birthTime.includes('PM')) {
        const [timeStr, period] = birthTime.split(' ');
        const [hourStr, minuteStr] = timeStr.split(':');
        let parsedHour = parseInt(hourStr, 10);
        
        if (period === 'AM' && parsedHour === 12) {
          parsedHour = 0;
        } else if (period === 'PM' && parsedHour !== 12) {
          parsedHour += 12;
        }
        
        hour = parsedHour;
      } else {
        // Handle 24-hour format
        const [hourStr] = birthTime.split(':');
        hour = parseInt(hourStr, 10) || 12;
      }
    } catch (error) {
      console.warn('Error parsing birth time:', birthTime, error);
      hour = 12; // Default fallback
    }
  }
  
  // Simplified moon sign calculation (moon moves ~13 degrees per day)
  // In reality, this would require complex astronomical calculations
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const moonCycle = (dayOfYear + (hour / 24)) % 30; // Approximate 30-day lunar cycle
  
  const signs: ZodiacSign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const signIndex = Math.floor(moonCycle / 2.5) % 12; // Approximate distribution
  
  return signs[signIndex];
}

// Rising sign calculation (simplified - based on birth time and location)
export function getRisingSign(birthday: string, birthTime?: string, birthLocation?: string): ZodiacSign {
  const date = new Date(birthday);
  let hour = 6; // Default to 6 AM if no time provided
  
  if (birthTime && birthTime !== 'Unknown') {
    // Handle both "12:00 AM" and "12:00" formats
    try {
      if (birthTime.includes('AM') || birthTime.includes('PM')) {
        const [timeStr, period] = birthTime.split(' ');
        const [hourStr, minuteStr] = timeStr.split(':');
        let parsedHour = parseInt(hourStr, 10);
        
        if (period === 'AM' && parsedHour === 12) {
          parsedHour = 0;
        } else if (period === 'PM' && parsedHour !== 12) {
          parsedHour += 12;
        }
        
        hour = parsedHour;
      } else {
        // Handle 24-hour format
        const [hourStr] = birthTime.split(':');
        hour = parseInt(hourStr, 10) || 6;
      }
    } catch (error) {
      console.warn('Error parsing birth time:', birthTime, error);
      hour = 6; // Default fallback
    }
  }
  
  // Simplified rising sign calculation (rising sign changes every ~2 hours)
  // In reality, this would require precise astronomical calculations with coordinates
  const signs: ZodiacSign[] = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  
  // Simple calculation based on birth hour (rising sign changes every ~2 hours)
  const risingIndex = Math.floor(hour / 2) % 12;
  
  // Add some variation based on birth location (very simplified)
  let locationOffset = 0;
  if (birthLocation && birthLocation !== 'Unknown') {
    locationOffset = birthLocation.length % 3; // Simple hash-like offset
  }
  
  const finalIndex = (risingIndex + locationOffset) % 12;
  return signs[finalIndex];
}

// Helper function to calculate all three signs at once
export function calculateBigThree(birthday: string, birthTime?: string, birthLocation?: string) {
  return {
    sunSign: getZodiacSign(birthday),
    moonSign: getMoonSign(birthday, birthTime),
    risingSign: getRisingSign(birthday, birthTime, birthLocation)
  };
}

export function getCompatibilityScore(sign1: ZodiacSign, sign2: ZodiacSign): number {
  // Simplified compatibility matrix
  const compatibility: Record<ZodiacSign, Record<ZodiacSign, number>> = {
    Aries: { Aries: 75, Taurus: 60, Gemini: 85, Cancer: 55, Leo: 90, Virgo: 65, Libra: 80, Scorpio: 70, Sagittarius: 95, Capricorn: 50, Aquarius: 85, Pisces: 60 },
    Taurus: { Aries: 60, Taurus: 80, Gemini: 55, Cancer: 85, Leo: 65, Virgo: 90, Libra: 70, Scorpio: 75, Sagittarius: 50, Capricorn: 95, Aquarius: 55, Pisces: 80 },
    Gemini: { Aries: 85, Taurus: 55, Gemini: 70, Cancer: 60, Leo: 80, Virgo: 65, Libra: 95, Scorpio: 55, Sagittarius: 85, Capricorn: 60, Aquarius: 90, Pisces: 65 },
    Cancer: { Aries: 55, Taurus: 85, Gemini: 60, Cancer: 75, Leo: 70, Virgo: 80, Libra: 65, Scorpio: 95, Sagittarius: 55, Capricorn: 75, Aquarius: 60, Pisces: 90 },
    Leo: { Aries: 90, Taurus: 65, Gemini: 80, Cancer: 70, Leo: 75, Virgo: 60, Libra: 85, Scorpio: 65, Sagittarius: 90, Capricorn: 55, Aquarius: 80, Pisces: 70 },
    Virgo: { Aries: 65, Taurus: 90, Gemini: 65, Cancer: 80, Leo: 60, Virgo: 75, Libra: 70, Scorpio: 80, Sagittarius: 60, Capricorn: 85, Aquarius: 65, Pisces: 75 },
    Libra: { Aries: 80, Taurus: 70, Gemini: 95, Cancer: 65, Leo: 85, Virgo: 70, Libra: 75, Scorpio: 70, Sagittarius: 80, Capricorn: 65, Aquarius: 90, Pisces: 75 },
    Scorpio: { Aries: 70, Taurus: 75, Gemini: 55, Cancer: 95, Leo: 65, Virgo: 80, Libra: 70, Scorpio: 80, Sagittarius: 60, Capricorn: 75, Aquarius: 65, Pisces: 85 },
    Sagittarius: { Aries: 95, Taurus: 50, Gemini: 85, Cancer: 55, Leo: 90, Virgo: 60, Libra: 80, Scorpio: 60, Sagittarius: 75, Capricorn: 55, Aquarius: 85, Pisces: 65 },
    Capricorn: { Aries: 50, Taurus: 95, Gemini: 60, Cancer: 75, Leo: 55, Virgo: 85, Libra: 65, Scorpio: 75, Sagittarius: 55, Capricorn: 80, Aquarius: 60, Pisces: 70 },
    Aquarius: { Aries: 85, Taurus: 55, Gemini: 90, Cancer: 60, Leo: 80, Virgo: 65, Libra: 90, Scorpio: 65, Sagittarius: 85, Capricorn: 60, Aquarius: 75, Pisces: 70 },
    Pisces: { Aries: 60, Taurus: 80, Gemini: 65, Cancer: 90, Leo: 70, Virgo: 75, Libra: 75, Scorpio: 85, Sagittarius: 65, Capricorn: 70, Aquarius: 70, Pisces: 80 }
  };

  return compatibility[sign1]?.[sign2] || 50;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

export function generateChatId(): string {
  return 'chat_' + Math.random().toString(36).substr(2, 9);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAstrologyInsight(zodiacSign: ZodiacSign): string {
  const insights: Record<ZodiacSign, string> = {
    Aries: "Bold and pioneering, you lead with passion and courage. Your fiery spirit ignites inspiration in others.",
    Taurus: "Grounded and reliable, you bring stability and beauty to everything you touch. Your patience is your superpower.",
    Gemini: "Curious and adaptable, your mind sparkles with endless possibilities. Communication is your gift to the world.",
    Cancer: "Nurturing and intuitive, you feel deeply and care profoundly. Your emotional wisdom guides others home.",
    Leo: "Radiant and generous, you shine your light on everyone around you. Your creativity knows no bounds.",
    Virgo: "Precise and thoughtful, you perfect the art of service. Your attention to detail creates lasting beauty.",
    Libra: "Harmonious and diplomatic, you bring balance to chaos. Your sense of justice creates a better world.",
    Scorpio: "Intense and transformative, you dive deep into life's mysteries. Your passion transforms everything you touch.",
    Sagittarius: "Adventurous and philosophical, you explore both worlds and ideas. Your optimism lights the way forward.",
    Capricorn: "Ambitious and disciplined, you build lasting legacies. Your determination conquers any mountain.",
    Aquarius: "Innovative and humanitarian, you envision the future. Your uniqueness is exactly what the world needs.",
    Pisces: "Compassionate and intuitive, you flow with life's currents. Your empathy heals the world around you."
  };

  return insights[zodiacSign] || "The stars have special plans for you.";
}

export function generateSoulmatePrompt(
  userSign: ZodiacSign, 
  genderPreference: string, 
  racePreferences: string[]
): string {
  const raceDescriptor = racePreferences.length > 0 
    ? racePreferences.join(' and ') 
    : 'diverse';
    
  return `Create a detailed sketch portrait of a ${genderPreference} person of ${raceDescriptor} ethnicity who would be astrologically compatible with a ${userSign}. The person should have kind, intelligent eyes and an approachable, warm expression. Draw them in a realistic portrait style with soft shading, showing someone who embodies the complementary qualities that would harmonize perfectly with a ${userSign} personality. The portrait should be a pencil sketch style with detailed facial features, expressing wisdom, compassion, and the specific traits that would create a deep cosmic connection with ${userSign}.`;
} 

// Smart input formatting utilities
export const formatDateInput = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Format as MM/DD/YYYY
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  } else {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`
  }
}

export const validateDate = (dateString: string): { isValid: boolean; error?: string } => {
  // Check if format is complete MM/DD/YYYY
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return { isValid: false, error: "Please enter date in MM/DD/YYYY format" }
  }
  
  const [month, day, year] = dateString.split('/').map(Number)
  const currentYear = new Date().getFullYear()
  const currentDate = new Date()
  
  // Validate year (1900 to current year)
  if (year < 1900 || year > currentYear) {
    return { isValid: false, error: `Year must be between 1900 and ${currentYear}` }
  }
  
  // Validate month
  if (month < 1 || month > 12) {
    return { isValid: false, error: "Month must be between 01 and 12" }
  }
  
  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate()
  
  // Validate day
  if (day < 1 || day > daysInMonth) {
    return { isValid: false, error: `Day must be between 01 and ${daysInMonth} for the selected month` }
  }
  
  // Check if date is not in the future
  const inputDate = new Date(year, month - 1, day)
  if (inputDate > currentDate) {
    return { isValid: false, error: "Birth date cannot be in the future" }
  }
  
  return { isValid: true }
}

export const formatTimeInput = (value: string): string => {
  // Remove all non-alphanumeric characters except colon and space
  const cleaned = value.replace(/[^0-9:APMapm\s]/g, '').toUpperCase()
  
  // Extract numbers and letters
  const numbers = cleaned.replace(/[^0-9]/g, '')
  const letters = cleaned.replace(/[^APM]/g, '')
  
  // Format time part
  let timeStr = ''
  if (numbers.length <= 2) {
    timeStr = numbers
  } else if (numbers.length <= 4) {
    timeStr = `${numbers.slice(0, 2)}:${numbers.slice(2)}`
  } else {
    timeStr = `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`
  }
  
  // Add AM/PM if letters are present
  if (letters.length >= 1) {
    if (letters.includes('A')) {
      timeStr += ' AM'
    } else if (letters.includes('P')) {
      timeStr += ' PM'
    }
  }
  
  return timeStr
}

export const validateTime = (timeString: string): { isValid: boolean; error?: string } => {
  // Check if format matches HH:MM AM/PM
  if (!/^\d{1,2}:\d{2}\s(AM|PM)$/.test(timeString)) {
    return { isValid: false, error: "Please enter time in HH:MM AM/PM format" }
  }
  
  const [time, period] = timeString.split(' ')
  const [hours, minutes] = time.split(':').map(Number)
  
  // Validate hours (1-12)
  if (hours < 1 || hours > 12) {
    return { isValid: false, error: "Hours must be between 1 and 12" }
  }
  
  // Validate minutes (0-59)
  if (minutes < 0 || minutes > 59) {
    return { isValid: false, error: "Minutes must be between 00 and 59" }
  }
  
  return { isValid: true }
}

export const shouldShowTimeAMPMSuggestion = (value: string): boolean => {
  // Show AM/PM suggestion when user has typed a valid time but no AM/PM
  const timePattern = /^\d{1,2}:\d{2}$/
  return timePattern.test(value.trim())
}

// Enhanced location validation
export const validateLocation = (location: string): boolean => {
  return location.trim().length >= 2
} 