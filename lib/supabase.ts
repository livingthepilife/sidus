import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client for general use (non-auth contexts)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Client for component use with proper auth context
export const createSupabaseClient = () => createClientComponentClient()

// Auth functions
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password })
}

export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Database schema setup queries (for reference - not used in production)
export const createTables = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  birthday DATE NOT NULL,
  birth_location TEXT NOT NULL,
  zodiac_sign TEXT,
  gender_preference TEXT,
  race_preference TEXT[],
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  chat_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- People table
CREATE TABLE IF NOT EXISTS people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zodiac_sign TEXT,
  birthday DATE,
  birth_location TEXT,
  relationship_type TEXT,
  compatibility_score INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soulmate generations table
CREATE TABLE IF NOT EXISTS soulmate_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  gender_preference TEXT NOT NULL,
  race_preference TEXT[] NOT NULL,
  image_url TEXT NOT NULL,
  compatibility_score INTEGER NOT NULL,
  astrological_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_type TEXT NOT NULL,
  title TEXT NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE soulmate_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own people" ON people FOR SELECT USING (true);
CREATE POLICY "Users can insert own people" ON people FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own people" ON people FOR UPDATE USING (true);

CREATE POLICY "Users can view own generations" ON soulmate_generations FOR SELECT USING (true);
CREATE POLICY "Users can insert own generations" ON soulmate_generations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert own sessions" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sessions" ON chat_sessions FOR UPDATE USING (true);
`;

export async function initializeDatabase() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTables 
    });
    
    if (error) {
      console.log('Database already initialized or error:', error);
    } else {
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.log('Database initialization skipped:', error);
  }
} 