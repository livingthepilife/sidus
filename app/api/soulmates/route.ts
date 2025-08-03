import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      personalInfo,
      astrologicalInfo,
      compatibilityInfo,
      imageUrl
    } = await request.json()

    // Insert the soulmate into the database
    const { data, error } = await supabase
      .from('soulmates')
      .insert({
        user_id: user.id,
        personal_info: personalInfo,
        astrological_info: astrologicalInfo,
        compatibility_info: compatibilityInfo,
        image_url: imageUrl
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting soulmate:', error)
      return NextResponse.json(
        { error: 'Failed to save soulmate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Soulmate storage error:', error)
    return NextResponse.json(
      { error: 'Failed to store soulmate' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's most recent soulmate
    const { data, error } = await supabase
      .from('soulmates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No soulmate found
        return NextResponse.json({
          success: true,
          data: null
        })
      }
      console.error('Error fetching soulmate:', error)
      return NextResponse.json(
        { error: 'Failed to fetch soulmate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Soulmate fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch soulmate' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete the user's most recent soulmate
    const { error } = await supabase
      .from('soulmates')
      .delete()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error deleting soulmate:', error)
      return NextResponse.json(
        { error: 'Failed to delete soulmate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Soulmate deleted successfully'
    })

  } catch (error) {
    console.error('Soulmate deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete soulmate' },
      { status: 500 }
    )
  }
} 