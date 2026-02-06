import type { Metadata } from 'next';
import {
  HeroSection,
  FeaturesSection,
  DestinationsSection,
  CentersSection,
} from '@/components/home';
import { getTranslationsServer } from '@/lib/i18n/get-translations-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsServer();
  return {
    title: t('metadata.home.title'),
    description: t('metadata.home.description'),
  };
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <DestinationsSection />
      <CentersSection />
    </>
  );
}
