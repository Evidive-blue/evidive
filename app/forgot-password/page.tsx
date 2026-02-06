import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import ForgotPasswordClient from './forgot-password-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.forgotPassword.title'),
    description: t('metadata.forgotPassword.description'),
  };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
