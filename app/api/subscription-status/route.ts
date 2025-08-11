import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get subscription status from database
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching subscription status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: userStats?.subscription_status || 'none',
      trialEndDate: userStats?.trial_end_date,
      subscriptionEndDate: userStats?.subscription_end_date
    })

  } catch (error) {
    console.error('Error in subscription status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
