import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

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

    // Get or create Stripe customer
    let customer: Stripe.Customer

    // Check if user already has a Stripe customer ID
    const { data: userStats } = await supabase
      .from('user_stats')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (userStats?.stripe_customer_id) {
      // Retrieve existing customer
      customer = await stripe.customers.retrieve(userStats.stripe_customer_id) as Stripe.Customer
    } else {
      // Get user email from auth
      const { data: user } = await supabase.auth.admin.getUserById(userId)
      
      // Create new customer
      customer = await stripe.customers.create({
        email: user.user?.email,
        metadata: {
          userId: userId,
        },
      })

      // Save customer ID to database
      await supabase
        .from('user_stats')
        .update({ stripe_customer_id: customer.id })
        .eq('user_id', userId)
    }

    // Create checkout session with free trial
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // Weekly subscription price ID
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId: userId,
        },
      },
      metadata: {
        userId: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/app?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/paywall`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}