import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { EditServiceForm } from './edit-service-form';

interface Props {
  params: Promise<{ slug: string; serviceId: string }>;
}

export const metadata: Metadata = {
  title: 'Edit Service | EviDive',
  description: 'Edit your dive service',
};

export default async function EditServicePage({ params }: Props) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const { slug, serviceId } = await params;

  const center = await prisma.center.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      ownerId: true,
      name: true,
    },
  });

  if (!center) {
    notFound();
  }

  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service || service.centerId !== center.id) {
    notFound();
  }

  // Serialize Decimal
  const serializedService = {
    ...service,
    price: Number(service.price),
    maxDepth: service.maxDepth ? Number(service.maxDepth) : null,
  };

  return (
    <EditServiceForm
      center={{ id: center.id, slug: center.slug, name: center.name }}
      service={serializedService}
    />
  );
}
