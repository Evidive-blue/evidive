import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { TeamManageClient } from './team-manage-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: 'Manage Team | EviDive',
  description: 'Manage your dive center team members',
};

export default async function TeamManagePage({ params }: Props) {
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
      workers: {
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' },
        ],
      },
    },
  });

  if (!center) {
    notFound();
  }

  // Check ownership
  if (center.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <TeamManageClient center={center} />;
}
