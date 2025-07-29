import { NextRequest, NextResponse } from 'next/server'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { messages, chatType, userContext } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const response = await generateChatResponse(messages, chatType, userContext)

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