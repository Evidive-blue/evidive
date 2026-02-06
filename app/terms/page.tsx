import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import TermsClient from './terms-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.terms.title'),
    description: t('metadata.terms.description'),
  };
}

export default function TermsPage() {
  return <TermsClient />;
}
