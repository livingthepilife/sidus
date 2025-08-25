export interface User {
  id: string;
  email?: string;
  name: string;
  birthday: string;
  birth_location: string;
  zodiac_sign?: string;
  gender_preference?: string;
  race_preference?: string[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Updated Person interface to match new JSON table structure
export interface Person {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  personal_info: {
    name: string;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_location?: string | null;
    relationship_type?: string;
  };
  astrological_info: {
    sun_sign?: string;
    moon_sign?: string;
    rising_sign?: string;
  };
  notes?: string | null;
  photo_url?: string | null;
  is_favorite?: boolean;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  chat_type: string;
  created_at: string;
}

export interface SoulmateGeneration {
  id: string;
  user_id: string;
  person_id?: string;
  gender_preference: string;
  race_preference: string[];
  image_url: string;
  compatibility_score: number;
  astrological_description?: string;
  created_at: string;
}

export type ChatType = 
  | 'general' 
  | 'horoscope' 
  | 'compatibility' 
  | 'soulmate' 
  | 'onboarding'
  | 'person_analysis';

export interface OnboardingStep {
  id: string;
  question: string;
  type: 'text' | 'date' | 'location' | 'select' | 'multiselect';
  options?: string[];
  completed: boolean;
}

export interface ChatSession {
  id: string;
  user_id: string;
  chat_type: ChatType;
  title: string;
  last_message_at: string;
  created_at: string;
}

export interface AstrologyData {
  zodiac_sign: string;
  birth_date: string;
  birth_location: string;
  moon_sign?: string;
  rising_sign?: string;
  personality_traits?: string[];
  compatibility_signs?: string[];
}

export interface GenderOption {
  value: string;
  label: string;
}

export interface RaceOption {
  value: string;
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'all', label: 'All' },
];

export const RACE_OPTIONS: RaceOption[] = [
  { value: 'white', label: 'White/Caucasian' },
  { value: 'black', label: 'Black/African American' },
  { value: 'hispanic', label: 'Hispanic/Latino' },
  { value: 'asian', label: 'Asian' },
  { value: 'south_asian', label: 'South Asian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'native_american', label: 'Native American' },
  { value: 'pacific_islander', label: 'Pacific Islander' },
  { value: 'mixed', label: 'Mixed Race' },
  { value: 'east_asian', label: 'East Asian' },
  { value: 'southeast_asian', label: 'Southeast Asian' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'nordic', label: 'Nordic' },
  { value: 'slavic', label: 'Slavic' },
  { value: 'other', label: 'Other' },
];

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number]; 