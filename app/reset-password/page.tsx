import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import ResetPasswordClient from './reset-password-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.resetPassword.title'),
    description: t('metadata.resetPassword.description'),
  };
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
