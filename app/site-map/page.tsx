import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import SitemapClient from './site-map-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.sitemap.title'),
    description: t('metadata.sitemap.description'),
  };
}

export default function SitemapPage() {
  return <SitemapClient />;
}
