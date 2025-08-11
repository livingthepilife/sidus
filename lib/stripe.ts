// Stripe integration utilities
import Stripe from 'stripe'

export const STRIPE_PRICING = {
  weekly: {
    price: 6.99,
    trialDays: 7,
    interval: 'week' as const
  }
}

// Initialize Stripe for client-side usage (if needed)
let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!stripeClient && typeof window !== 'undefined') {
    stripeClient = new Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
      apiVersion: '2025-07-30.basil',
    })
  }
  return stripeClient!
}

export async function createCheckoutSession(userId?: string) {
  if (!userId) {
    throw new Error('User ID is required for checkout session')
  }
  
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session')
    }
    
    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error('No checkout URL returned')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function getSubscriptionStatus(userId: string): Promise<{
  status: string
  trialEndDate?: string
  subscriptionEndDate?: string
}> {
  try {
    const response = await fetch(`/api/subscription-status?userId=${userId}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get subscription status')
    }
    
    return data
  } catch (error) {
    console.error('Error getting subscription status:', error)
    throw error
  }
}

export async function cancelSubscription(userId: string): Promise<void> {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel subscription')
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function isTrialActive(trialEndDate?: string): boolean {
  if (!trialEndDate) return false
  return new Date(trialEndDate) > new Date()
}

export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trial'].includes(status)
}