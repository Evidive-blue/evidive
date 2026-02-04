import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { stripe, isStripeConfigured } from '@/lib/stripe';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;

    const center = await prisma.center.findUnique({
      where: { slug },
      select: {
        id: true,
        ownerId: true,
        name: true,
        email: true,
        stripeAccountId: true,
        country: true,
      },
    });

    if (!center) {
      return NextResponse.json({ error: 'Center not found' }, { status: 404 });
    }

    if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const getLocalizedName = (value: unknown): string => {
      if (!value) return 'Dive Center';
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, string>;
        return obj.en || obj.fr || Object.values(obj)[0] || 'Dive Center';
      }
      return 'Dive Center';
    };

    let accountId = center.stripeAccountId;

    // Create Stripe Connect account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: getCountryCode(center.country),
        email: center.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: getLocalizedName(center.name),
          mcc: '7941', // Sports and recreation camps
          url: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/centers/${slug}` : `https://evidive.blue/centers/${slug}`,
        },
        metadata: {
          centerId: center.id,
          centerSlug: slug,
        },
      });

      accountId = account.id;

      await prisma.center.update({
        where: { id: center.id },
        data: {
          stripeAccountId: accountId,
        },
      });
    }

    // Create account link for onboarding
    const origin = request.headers.get('origin') || 'https://evidive.whytcard.ai';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/center/manage/${slug}/payments?refresh=true`,
      return_url: `${origin}/center/manage/${slug}/payments?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error connecting Stripe:', error);
    return NextResponse.json(
      { error: 'Failed to connect Stripe account' },
      { status: 500 }
    );
  }
}

function getCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    'France': 'FR',
    'United States': 'US',
    'USA': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Germany': 'DE',
    'Spain': 'ES',
    'Italy': 'IT',
    'Portugal': 'PT',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Australia': 'AU',
    'Canada': 'CA',
    'Mexico': 'MX',
    'Brazil': 'BR',
    'Japan': 'JP',
    'Singapore': 'SG',
    'Thailand': 'TH',
    'Indonesia': 'ID',
    'Malaysia': 'MY',
    'Philippines': 'PH',
    'Egypt': 'EG',
    'Greece': 'GR',
    'Croatia': 'HR',
    'Malta': 'MT',
    'Cyprus': 'CY',
    'Maldives': 'MV',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
  };

  return countryMap[country] || 'FR';
}
