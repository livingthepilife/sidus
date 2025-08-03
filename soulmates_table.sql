-- Create Soulmates table similar to people table structure
CREATE TABLE IF NOT EXISTS soulmates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    personal_info JSONB NOT NULL DEFAULT '{}',
    astrological_info JSONB NOT NULL DEFAULT '{}',
    compatibility_info JSONB NOT NULL DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_soulmates_user_id ON soulmates(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_soulmates_created_at ON soulmates(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE soulmates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own soulmates" ON soulmates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own soulmates" ON soulmates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own soulmates" ON soulmates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own soulmates" ON soulmates
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_soulmates_updated_at 
    BEFORE UPDATE ON soulmates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Example of how the JSONB columns should be structured:

-- personal_info JSONB structure:
-- {
--   "name": "Your Soulmate",
--   "gender": "female",
--   "ethnicity": ["asian", "east_asian"]
-- }

-- astrological_info JSONB structure:
-- {
--   "sun_sign": "Aries",
--   "moon_sign": "Libra", 
--   "rising_sign": "Scorpio",
--   "soulmate_sign": "Aries"
-- }

-- compatibility_info JSONB structure:
-- {
--   "compatibility_score": 95,
--   "analysis": "Your Aquarian passion meets their fiery Aries spirit...",
--   "short_description": "Your Aquarian passion meets their fiery Aries spirit, igniting thrilling adventures, while your shared Scorpio rising fosters an intense emotional bond, creating an unbreakable connection."
-- } 