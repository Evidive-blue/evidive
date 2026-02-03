import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { BookingFormClient } from './booking-form-client';

interface Props {
  params: Promise<{ slug: string; serviceId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      center: { select: { name: true, slug: true } },
    },
  });

  if (!service || service.center.slug !== slug) {
    return { title: 'Service Not Found | EviDive' };
  }

  const getLocalized = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const obj = value as Record<string, string>;
      return obj.en || obj.fr || Object.values(obj)[0] || '';
    }
    return '';
  };

  const serviceName = getLocalized(service.name);
  const centerName = getLocalized(service.center.name);

  return {
    title: `Book ${serviceName} - ${centerName} | EviDive`,
    description: `Reserve your spot for ${serviceName} at ${centerName}. Book online with instant confirmation.`,
  };
}

export default async function BookingPage({ params }: Props) {
  const { slug, serviceId } = await params;

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          country: true,
          cancellationPolicy: true,
          cancellationHours: true,
        },
      },
      extras: {
        where: { isActive: true },
        orderBy: { isRequired: 'desc' },
      },
    },
  });

  if (!service || service.center.slug !== slug) {
    notFound();
  }

  // Check if service is active
  if (!service.isActive) {
    notFound();
  }

  // Serialize for client
  const serializedService = {
    ...service,
    price: Number(service.price),
    extras: service.extras.map((e) => ({
      ...e,
      price: Number(e.price),
    })),
  };

  return <BookingFormClient service={serializedService} />;
}
