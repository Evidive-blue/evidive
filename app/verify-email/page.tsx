import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import VerifyEmailClient from './verify-email-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.verifyEmail.title'),
    description: t('metadata.verifyEmail.description'),
  };
}

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
