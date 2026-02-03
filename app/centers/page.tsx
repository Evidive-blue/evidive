import { Suspense } from 'react';
import { prisma } from '@/lib/db/prisma';
import { CentersClient } from './centers-client';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';

// Server Component - Fetch centers
async function getCenters() {
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
        latitude: Number(center.latitude),
        longitude: Number(center.longitude),
        rating: Number(avgRating._avg.rating) || 0,
        reviewCount: center._count.reviews,
        serviceCount: center._count.services,
        mapIcon: center.mapIcon || 'diver',
      };
    })
  );

  return centersWithRating;
}

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
