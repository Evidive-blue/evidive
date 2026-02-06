import type { Metadata } from 'next';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { CentersClient } from './centers-client';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';

// ISR: Revalidate every 5 minutes for fresh data while keeping fast loads
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.centers.title'),
    description: t('metadata.centers.description'),
  };
}

// Cache the centers query with tags for on-demand revalidation
const getCentersFromDB = async () => {
  const centers = await prisma.center.findMany({
    where: {
      status: 'APPROVED',
    },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      verified: true,
      mapIcon: true,
      featuredImage: true,
      logoUrl: true,
      _count: {
        select: {
          reviews: true,
          services: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate average rating for each center
  // Convert Decimal to number for Client Component serialization
  const centersWithRating = await Promise.all(
    centers.map(async (center) => {
      const avgRating = await prisma.review.aggregate({
        where: { centerId: center.id },
        _avg: { rating: true },
      });

      return {
        ...center,
        // Preserve null if no coordinates, don't convert to 0
        latitude: center.latitude !== null ? Number(center.latitude) : null,
        longitude: center.longitude !== null ? Number(center.longitude) : null,
        rating: Number(avgRating._avg.rating) || 0,
        reviewCount: center._count.reviews,
        serviceCount: center._count.services,
        mapIcon: center.mapIcon || 'diver',
        featuredImage: center.featuredImage,
        logoUrl: center.logoUrl,
      };
    })
  );

  return centersWithRating;
};

// Wrap with unstable_cache for data caching with tags
const getCenters = unstable_cache(
  getCentersFromDB,
  ['centers-list'],
  { 
    revalidate: 300, // 5 minutes
    tags: ['centers'] // Can invalidate with revalidateTag('centers')
  }
);

export default async function CentersPage() {
  const centers = await getCenters();
  const { t } = await getTranslationsServer();

  return (
    <Suspense
      fallback={
        <div className="pt-16 min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
        </div>
      }
    >
      <CentersClient centers={centers} />
    </Suspense>
  );
}
