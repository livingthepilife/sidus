import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

// Use service role key if available, otherwise fall back to anon key
const supabaseKey = supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here' 
  ? supabaseServiceKey 
  : supabaseAnonKey

const supabase = createClient(supabaseUrl, supabaseKey)

// If using anon key, we need to temporarily disable RLS for this to work
const isUsingServiceRole = supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here'

export async function POST(request: NextRequest) {
  try {
    const { user_id, personal_info, astrological_info } = await request.json()

    console.log('Received request:', { user_id, personal_info, astrological_info })
    console.log('Using service role key:', isUsingServiceRole)

    if (!user_id || !personal_info || !personal_info.name) {
      console.error('Missing required fields:', { user_id, personal_info })
      return NextResponse.json(
        { error: 'Missing required fields: user_id and personal_info.name are required' },
        { status: 400 }
      )
    }

    console.log('Attempting to insert into people table...')

    // Insert new person into the people table
    const { data, error } = await supabase
      .from('people')
      .insert({
        user_id,
        personal_info,
        astrological_info
      })
      .select()
      .single()

    if (error) {
      console.error('Database error details:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // If it's an RLS error and we're not using service role, provide specific guidance
      if (error.code === '42501' && !isUsingServiceRole) {
        console.log('🚨 RLS ERROR DETECTED - Need service role key!')
        return NextResponse.json(
          { 
            error: 'Database permission error. You need the SUPABASE_SERVICE_ROLE_KEY.',
            details: 'Go to Supabase Dashboard → Settings → API → Copy "service_role" key → Replace "your_service_role_key_here" in .env.local',
            instructions: [
              '1. Open Supabase Dashboard',
              '2. Go to Settings → API',
              '3. Copy the "service_role" key (NOT anon key)',
              '4. Edit .env.local file',
              '5. Replace "your_service_role_key_here" with your actual key',
              '6. Restart the dev server'
            ]
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Successfully created person:', data)

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')

  console.log('GET /api/people called with user_id:', user_id)

  if (!user_id) {
    return NextResponse.json(
      { error: 'user_id is required' },
      { status: 400 }
    )
  }

  try {
    console.log('Fetching people and soulmates...')

    // Fetch regular people
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (peopleError) {
      console.error('Database error fetching people:', peopleError)
      return NextResponse.json(
        { error: 'Failed to fetch people' },
        { status: 500 }
      )
    }

    // Fetch soulmates
    const { data: soulmatesData, error: soulmatesError } = await supabase
      .from('soulmates')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (soulmatesError) {
      console.error('Database error fetching soulmates:', soulmatesError)
      return NextResponse.json(
        { error: 'Failed to fetch soulmates' },
        { status: 500 }
      )
    }

    console.log('Successfully fetched people:', peopleData)
    console.log('Successfully fetched soulmates:', soulmatesData)

    // Transform soulmates data to match people format
    const transformedSoulmates = soulmatesData?.map(soulmate => ({
      id: soulmate.id,
      user_id: soulmate.user_id,
      personal_info: {
        ...soulmate.personal_info,
        relationship_type: 'soulmate' // Add relationship type to identify soulmates
      },
      astrological_info: soulmate.astrological_info,
      compatibility_info: soulmate.compatibility_info, // Include compatibility info for soulmates
      image_url: soulmate.image_url, // Include image URL for soulmates
      created_at: soulmate.created_at,
      updated_at: soulmate.updated_at,
      is_soulmate: true // Flag to identify this as a soulmate
    })) || []

    // Combine people and soulmates, sort by creation date
    const allPeople = [...(peopleData || []), ...transformedSoulmates]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      data: allPeople
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 