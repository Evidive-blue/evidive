import type { Metadata } from 'next';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';
import ContactClient from './contact-client';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.contact.title'),
    description: t('metadata.contact.description'),
  };
}

export default function ContactPage() {
  return <ContactClient />;
}
