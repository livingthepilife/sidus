import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's Stripe subscription ID
    const { data: userStats, error } = await supabase
      .from('user_stats')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single()

    if (error || !userStats?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      userStats.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update status in database
    await supabase
      .from('user_stats')
      .update({ 
        subscription_status: 'canceled',
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('user_id', userId)

    return NextResponse.json({ 
      message: 'Subscription canceled successfully',
      cancelAt: subscription.current_period_end
    })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
