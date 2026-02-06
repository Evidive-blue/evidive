import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import CareersClient from './careers-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.careers.title'),
    description: t('metadata.careers.description'),
  };
}

export default function CareersPage() {
  return <CareersClient />;
}
