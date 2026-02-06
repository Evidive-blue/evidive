import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import ExplorerClient from './explorer-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.explorer.title'),
    description: t('metadata.explorer.description'),
  };
}

export default function ExplorerPage() {
  return <ExplorerClient />;
}
