import { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

  return <CenterDetailClient center={center} />;
}
