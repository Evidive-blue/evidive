import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { prisma } from '@/lib/db/prisma';
import { CenterDetailClient } from './center-detail-client';
import { getLocale } from '@/lib/i18n/get-locale-server';
import { getMessages, getNestedValue } from '@/lib/i18n/get-messages';

interface Props {
  params: Promise<{ slug: string }>;
}

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [k, v]) => {
    return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }, template);
}

// Generate JSON-LD structured data for dive centers
function generateJsonLd(center: {
  name: unknown;
  shortDescription: unknown;
  city: string;
  country: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  featuredImage?: string | null;
  logoUrl?: string | null;
  latitude?: unknown;
  longitude?: unknown;
  rating: number;
  reviewCount: number;
  slug: string;
}, locale: string) {
  const getName = (name: unknown): string => {
    if (typeof name === 'string') return name;
    if (name && typeof name === 'object' && !Array.isArray(name)) {
      const obj = name as Record<string, unknown>;
      return (obj[locale] as string) || (obj.en as string) || (obj.fr as string) || 'Dive Center';
    }
    return 'Dive Center';
  };

  const getDesc = (desc: unknown): string => {
    if (typeof desc === 'string') return desc;
    if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
      const obj = desc as Record<string, unknown>;
      return (obj[locale] as string) || (obj.en as string) || (obj.fr as string) || '';
    }
    return '';
  };

  const lat = Number(center.latitude);
  const lng = Number(center.longitude);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: getName(center.name),
    description: getDesc(center.shortDescription),
    address: {
      '@type': 'PostalAddress',
      streetAddress: center.address || undefined,
      addressLocality: center.city,
      addressCountry: center.country,
    },
    url: `https://evidive.blue/centers/${center.slug}`,
  };

  // Add geo coordinates if available
  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    };
  }

  // Add contact info
  if (center.phone) jsonLd.telephone = center.phone;
  if (center.email) jsonLd.email = center.email;
  if (center.website) jsonLd.sameAs = center.website;

  // Add images
  const images: string[] = [];
  if (center.featuredImage) images.push(center.featuredImage);
  if (center.logoUrl) images.push(center.logoUrl);
  if (images.length > 0) jsonLd.image = images;

  // Add aggregate rating if reviews exist
  if (center.reviewCount > 0 && center.rating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: center.rating.toFixed(1),
      reviewCount: center.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add sport/activity type
  jsonLd.sport = 'Scuba Diving';

  return jsonLd;
}

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const messages = await getMessages(locale);
  
  const center = await prisma.center.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, city: true, country: true },
  });

  if (!center) {
    // Fallback to root metadata (no hardcoded strings here)
    return {};
  }

  const unnamed = requireString(messages, 'common.unnamed');
  const brandName = requireString(messages, 'footer.brandName');
  const titleTemplate = requireString(messages, 'metadata.centerDetail.title');
  const descriptionTemplate = requireString(messages, 'metadata.centerDetail.description');

  const getName = (name: unknown): string => {
    if (typeof name === 'string') return name;
    if (name && typeof name === 'object' && !Array.isArray(name)) {
      const obj = name as Record<string, unknown>;
      const preferred = obj[locale] as string | undefined;
      return preferred || (obj.en as string) || (obj.fr as string) || unnamed;
    }
    return unnamed;
  };

  const getDesc = (desc: unknown): string => {
    if (typeof desc === 'string') return desc;
    if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
      const obj = desc as Record<string, unknown>;
      const preferred = obj[locale] as string | undefined;
      return preferred || (obj.en as string) || (obj.fr as string) || '';
    }
    return '';
  };

  const centerName = getName(center.name);
  const shortDescription = getDesc(center.shortDescription);

  return {
    title: interpolate(titleTemplate, {
      centerName,
      city: center.city,
      country: center.country,
      brandName,
    }),
    description:
      shortDescription ||
      interpolate(descriptionTemplate, {
        centerName,
        city: center.city,
        country: center.country,
        brandName,
      }),
  };
}

export default async function CenterPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();

  const center = await prisma.center.findUnique({
    where: { slug, status: 'APPROVED' },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          diver: {
            select: { displayName: true, firstName: true, avatarUrl: true },
          },
        },
      },
      workers: {
        where: { isActive: true },
      },
      _count: {
        select: { reviews: true, bookings: true },
      },
    },
  });

  if (!center) {
    notFound();
  }

  // Increment view count
  await prisma.center.update({
    where: { id: center.id },
    data: { viewCount: { increment: 1 } },
  });

  // Generate JSON-LD structured data
  const jsonLd = generateJsonLd({
    name: center.name,
    shortDescription: center.shortDescription,
    city: center.city,
    country: center.country,
    address: center.address,
    phone: center.phone,
    email: center.email,
    website: center.website,
    featuredImage: center.featuredImage,
    logoUrl: center.logoUrl,
    latitude: Number(center.latitude),
    longitude: Number(center.longitude),
    rating: Number(center.rating),
    reviewCount: center._count.reviews,
    slug: center.slug,
  }, locale);

  // Serialize Decimal fields for Client Component
  const serializedCenter = {
    ...center,
    latitude: Number(center.latitude),
    longitude: Number(center.longitude),
    rating: Number(center.rating),
    commissionRate: Number(center.commissionRate),
    partialRefundPercent: center.partialRefundPercent ? Number(center.partialRefundPercent) : null,
    services: center.services.map((service) => ({
      ...service,
      price: Number(service.price),
    })),
    reviews: center.reviews.map((review) => ({
      ...review,
    })),
    workers: center.workers.map((worker) => ({
      ...worker,
    })),
  };

  return (
    <>
      <Script
        id="json-ld-center"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CenterDetailClient center={serializedCenter as any} />
    </>
  );
}
