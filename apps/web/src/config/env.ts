const apiUrl = process.env.NEXT_PUBLIC_API_URL

if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is not set')
}

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

export const env = {
  apiUrl,
  stripePublishableKey,
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}
