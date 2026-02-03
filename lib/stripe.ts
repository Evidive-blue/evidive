import Stripe from 'stripe';

// Only throw error in production - allow dev to run without Stripe key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null as unknown as Stripe;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
