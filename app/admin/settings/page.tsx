import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AdminSettingsClient } from './admin-settings-client';

export const metadata: Metadata = {
  title: 'Settings | Admin',
  description: 'Manage global platform settings',
};

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch settings
  const settings = await prisma.setting.findMany();

  // Parse settings into a usable format
  const settingsMap: Record<string, unknown> = {};
  settings.forEach((setting) => {
    settingsMap[setting.key] = setting.value;
  });

  // Get commission rate (default 15%)
  const commissionRate = typeof settingsMap.platformCommissionRate === 'number' 
    ? settingsMap.platformCommissionRate 
    : 15;

  return <AdminSettingsClient initialCommissionRate={commissionRate} />;
}
