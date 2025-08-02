import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseKey = supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here' 
  ? supabaseServiceKey 
  : supabaseAnonKey

const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { messages, chatType, userContext } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Fetch user's people data if userContext is provided
    let peopleContext = []
    if (userContext && userContext.userId) {
      try {
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', userContext.userId)
          .order('created_at', { ascending: false })

        if (peopleError) {
          console.error('Error fetching people:', peopleError)
        } else {
          peopleContext = peopleData || []
        }
      } catch (error) {
        console.error('Error fetching people context:', error)
      }
    }

    const response = await generateChatResponse(messages, chatType, userContext, peopleContext)

    return NextResponse.json({ 
      message: response,
      success: true 
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate chat response' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Chat API is working' })
} 