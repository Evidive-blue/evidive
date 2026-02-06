import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import AboutClient from './about-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.about.title'),
    description: t('metadata.about.description'),
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
