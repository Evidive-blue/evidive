import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { EditCenterForm } from './edit-center-form';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Edit Center | EviDive',
  description: 'Edit your dive center information',
};

export default async function EditCenterPage({ params }: Props) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const { slug } = await params;

  const center = await prisma.center.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      name: true,
      description: true,
      shortDescription: true,
      address: true,
      street2: true,
      city: true,
      region: true,
      country: true,
      zip: true,
      latitude: true,
      longitude: true,
      email: true,
      phone: true,
      website: true,
      facebook: true,
      instagram: true,
      whatsapp: true,
      certifications: true,
      languagesSpoken: true,
      equipmentRental: true,
      ecoCommitment: true,
      logoUrl: true,
      featuredImage: true,
      photos: true,
      openingHours: true,
      cancellationPolicy: true,
      cancellationHours: true,
    },
  });

  if (!center) {
    notFound();
  }

  // Check ownership
  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Serialize Decimal fields
  const serializedCenter = {
    ...center,
    latitude: Number(center.latitude),
    longitude: Number(center.longitude),
  };

  return <EditCenterForm center={serializedCenter} />;
}
