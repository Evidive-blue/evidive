'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function PrivacyClient() {
  const t = useTranslations('legal.privacy');

  const sections = [
    { title: t('collection_title'), content: t('collection_text') },
    { title: t('usage_title'), content: t('usage_text') },
    { title: t('protection_title'), content: t('protection_text') },
    { title: t('cookies_title'), content: t('cookies_text') },
  ];

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 lg:py-24 ocean-gradient-hero">
        <div className="container-custom">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-white text-center"
          >
            {t('title')}
          </motion.h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container-custom max-w-3xl">
          <Card>
            <CardContent className="p-6 lg:p-8 space-y-8">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                  <p className="text-muted-foreground">{section.content}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
