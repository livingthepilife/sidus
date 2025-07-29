-- Create the people table with correct JSON structure and proper foreign key reference
-- This references user_stats.user_id (which should be the auth user ID)

-- Drop existing people table if it exists
DROP TABLE IF EXISTS people CASCADE;

-- Create or replace the update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new people table with JSON columns
CREATE TABLE people (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL, -- References auth.users.id (same as user_stats.user_id)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Personal information stored as JSON
  personal_info jsonb NOT NULL DEFAULT '{}',
  -- Expected structure: {
  --   "name": "string",
  --   "birth_date": "YYYY-MM-DD" or null,
  --   "birth_time": "HH:MM AM/PM" or null,
  --   "birth_location": "string" or null,
  --   "relationship_type": "romantic_interest" | "friend" | "family" | etc.
  -- }
  
  -- Astrological information stored as JSON
  astrological_info jsonb DEFAULT '{}',
  -- Expected structure: {
  --   "sun_sign": "Aries" | "Taurus" | etc.,
  --   "moon_sign": "Aries" | "Taurus" | etc.,
  --   "rising_sign": "Aries" | "Taurus" | etc.
  -- }
  
  -- Additional optional fields
  notes text,
  photo_url text,
  is_favorite boolean DEFAULT false,
  
  -- Constraints to ensure personal_info has required fields
  CONSTRAINT personal_info_has_name CHECK (personal_info ? 'name' AND personal_info->>'name' IS NOT NULL AND personal_info->>'name' != ''),
  
  -- Constraints to validate zodiac signs if they exist
  CONSTRAINT valid_sun_sign CHECK (
    astrological_info->>'sun_sign' IS NULL OR 
    astrological_info->>'sun_sign' IN (
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    )
  ),
  CONSTRAINT valid_moon_sign CHECK (
    astrological_info->>'moon_sign' IS NULL OR 
    astrological_info->>'moon_sign' IN (
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    )
  ),
  CONSTRAINT valid_rising_sign CHECK (
    astrological_info->>'rising_sign' IS NULL OR 
    astrological_info->>'rising_sign' IN (
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    )
  )
);

-- Create indexes for performance (using correct index types)
CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_created_at ON people(created_at);
CREATE INDEX idx_people_is_favorite ON people(is_favorite);

-- Use GIN indexes on the entire JSON columns for efficient querying
CREATE INDEX idx_people_personal_info ON people USING gin (personal_info);
CREATE INDEX idx_people_astrological_info ON people USING gin (astrological_info);

-- Use B-tree indexes for specific JSON field lookups
CREATE INDEX idx_people_name ON people ((personal_info->>'name'));
CREATE INDEX idx_people_relationship_type ON people ((personal_info->>'relationship_type'));
CREATE INDEX idx_people_sun_sign ON people ((astrological_info->>'sun_sign'));

-- Enable Row Level Security
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own people" ON people;
DROP POLICY IF EXISTS "Users can insert own people" ON people;
DROP POLICY IF EXISTS "Users can update own people" ON people;
DROP POLICY IF EXISTS "Users can delete own people" ON people;

-- Create comprehensive RLS policies
-- Policy for SELECT (viewing) - users can only see their own people
CREATE POLICY "Users can view own people" ON people 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for INSERT (creating new people) - users can only create people for themselves
CREATE POLICY "Users can insert own people" ON people 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying existing people) - users can only update their own people
CREATE POLICY "Users can update own people" ON people 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing people) - users can only delete their own people
CREATE POLICY "Users can delete own people" ON people 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_people_updated_at 
  BEFORE UPDATE ON people
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions to extract JSON data for easy querying
CREATE OR REPLACE FUNCTION get_person_name(person_record people)
RETURNS text AS $$
BEGIN
  RETURN person_record.personal_info->>'name';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_person_relationship_type(person_record people)
RETURNS text AS $$
BEGIN
  RETURN person_record.personal_info->>'relationship_type';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_person_sun_sign(person_record people)
RETURNS text AS $$
BEGIN
  RETURN person_record.astrological_info->>'sun_sign';
END;
$$ LANGUAGE plpgsql IMMUTABLE; 