import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import PrivacyClient from './privacy-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.privacy.title'),
    description: t('metadata.privacy.description'),
  };
}

export default function PrivacyPage() {
  return <PrivacyClient />;
}
