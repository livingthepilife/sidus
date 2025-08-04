import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// TODO: Add Stripe SDK import
// import Stripe from 'stripe'

// TODO: Initialize Stripe with your secret key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// })

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature
    // const sig = request.headers.get('stripe-signature')!
    // const body = await request.text()
    
    // let event: Stripe.Event
    // try {
    //   event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    // } catch (err) {
    //   console.error('Webhook signature verification failed:', err)
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    // }

    // Handle the event
    // switch (event.type) {
    //   case 'customer.subscription.created':
    //   case 'customer.subscription.updated':
    //     const subscription = event.data.object as Stripe.Subscription
    //     const userId = subscription.metadata?.userId
    //     
    //     if (userId) {
    //       const status = subscription.status === 'active' || subscription.status === 'trialing' 
    //         ? 'active' 
    //         : subscription.status === 'canceled' 
    //         ? 'none' 
    //         : subscription.status
    //         
    //       await supabase
    //         .from('user_stats')
    //         .update({ 
    //           subscription_status: status,
    //           stripe_customer_id: subscription.customer as string,
    //           stripe_subscription_id: subscription.id
    //         })
    //         .eq('user_id', userId)
    //     }
    //     break
    //     
    //   case 'customer.subscription.deleted':
    //     const deletedSub = event.data.object as Stripe.Subscription
    //     const deletedUserId = deletedSub.metadata?.userId
    //     
    //     if (deletedUserId) {
    //       await supabase
    //         .from('user_stats')
    //         .update({ subscription_status: 'none' })
    //         .eq('user_id', deletedUserId)
    //     }
    //     break
    //     
    //   default:
    //     console.log(`Unhandled event type ${event.type}`)
    // }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}