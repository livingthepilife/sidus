# Sidus - Your Cosmic Guide

A responsive web application that provides astrological guidance, horoscopes, and AI-powered soulmate discovery. Built with Next.js, Supabase, and OpenAI.

## ✨ Features

- **Responsive Design**: Works perfectly on mobile and desktop devices
- **Chat-based Onboarding**: Conversational setup process to collect user information
- **AI-Powered Soulmate Generation**: Create personalized soulmate portraits using DALL-E
- **Multiple Chat Features**:
  - General astrological guidance
  - Daily horoscopes
  - Romantic compatibility analysis
  - Soulmate discovery
- **People Management**: Track and analyze people in your life
- **Cosmic Theming**: Beautiful starry night aesthetic with animations

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase
--
- **AI**: OpenAI GPT-4 and DALL-E 3
- **Icons**: Lucide React

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API account with credits

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sidus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   
   In your Supabase project dashboard, run the following SQL to create the necessary tables:
   
   ```sql
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
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### OpenAI Setup

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key
3. Add credits to your account (required for DALL-E image generation)
4. Add the API key to your `.env.local` file

### Supabase Setup

1. Create a new project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key from the API settings
3. Run the SQL schema provided above in the SQL editor
4. Add the credentials to your `.env.local` file

## 📱 Usage

1. **Landing Page**: Start by clicking "Begin Your Cosmic Journey"
2. **Onboarding**: Chat with Sidus to provide your name, birthday, and birth location
3. **Main App**: Access different features through the two main tabs:
   - **Chat**: Various astrological guidance features
   - **People**: Manage people in your life
4. **Soulmate Discovery**: 
   - Select "Your soulmate" from the chat features
   - Choose your gender and race preferences
   - Watch as your AI-generated soulmate is revealed!

## 🎨 Features in Detail

### Soulmate Generation Flow
- Preference collection (gender and race)
- AI image generation using DALL-E 3
- Compatibility analysis based on zodiac signs
- Detailed astrological explanation

### Chat Features
- **Ask me anything**: General cosmic guidance
- **Daily horoscope**: Personalized daily insights
- **Romantic compatibility**: Analyze relationships
- **Your soulmate**: Complete soulmate discovery

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interface
- Optimized for both mobile and desktop use

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Heroku

## 🛡️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app's URL | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the environment variables are correctly set
2. Ensure Supabase tables are created
3. Verify OpenAI API key has sufficient credits
4. Check the browser console for error messages

## 🌟 Acknowledgments

- OpenAI for GPT-4 and DALL-E 3
- Supabase for the backend infrastructure
- shadcn/ui for the beautiful components
- Vercel for hosting and deployment 