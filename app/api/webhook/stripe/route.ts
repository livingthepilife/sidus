import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Create a service role client that bypasses RLS for webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const sig = request.headers.get('stripe-signature')!
    const body = await request.text()
    
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Received webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        
        console.log('Subscription metadata:', subscription.metadata)
        console.log('User ID from metadata:', userId)
        console.log('Subscription status:', subscription.status)
        
        if (userId) {
          // Determine subscription status
          let status: string
          switch (subscription.status) {
            case 'active':
            case 'trialing':
              status = 'active'
              break
            case 'canceled':
              status = 'canceled'
              break
            case 'past_due':
              status = 'past_due'
              break
            case 'unpaid':
            case 'incomplete':
            case 'incomplete_expired':
              status = 'none'
              break
            default:
              status = subscription.status
          }

          // Calculate trial end date
          const trialEndDate = subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null

          // Calculate subscription end date  
          const subscriptionEndDate = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : null

          const { data, error } = await supabaseAdmin
            .from('user_stats')
            .upsert({ 
              user_id: userId,
              subscription_status: status,
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              trial_end_date: trialEndDate,
              subscription_end_date: subscriptionEndDate
            }, {
              onConflict: 'user_id'
            })
            .select()

          if (error) {
            console.error('Database update error:', error)
          } else {
            console.log('Database update successful:', data)
          }

          console.log(`Updated subscription for user ${userId}: ${status}`)
        }
        break
        
      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription
        const deletedUserId = deletedSub.metadata?.userId
        
        if (deletedUserId) {
          const { error } = await supabaseAdmin
            .from('user_stats')
            .update({ 
              subscription_status: 'none',
              stripe_subscription_id: null,
              trial_end_date: null,
              subscription_end_date: null
            })
            .eq('user_id', deletedUserId)

          if (error) {
            console.error('Database update error for deleted subscription:', error)
          }

          console.log(`Deleted subscription for user ${deletedUserId}`)
        }
        break

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const sessionUserId = session.metadata?.userId
        
        if (sessionUserId && session.subscription) {
          // Update user status to trial/active
          await supabaseAdmin
            .from('user_stats')
            .update({ 
              subscription_status: 'active',
              stripe_subscription_id: session.subscription as string
            })
            .eq('user_id', sessionUserId)

          console.log(`Checkout completed for user ${sessionUserId}`)
        }
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        if ((invoice as any).subscription) {
          // Get subscription to find user ID
          const sub = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
          const invoiceUserId = sub.metadata?.userId
          
          if (invoiceUserId) {
            await supabaseAdmin
              .from('user_stats')
              .update({ subscription_status: 'active' })
              .eq('user_id', invoiceUserId)

            console.log(`Payment succeeded for user ${invoiceUserId}`)
          }
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        if ((failedInvoice as any).subscription) {
          // Get subscription to find user ID
          const failedSub = await stripe.subscriptions.retrieve((failedInvoice as any).subscription as string)
          const failedUserId = failedSub.metadata?.userId
          
          if (failedUserId) {
            await supabaseAdmin
              .from('user_stats')
              .update({ subscription_status: 'past_due' })
              .eq('user_id', failedUserId)

            console.log(`Payment failed for user ${failedUserId}`)
          }
        }
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}