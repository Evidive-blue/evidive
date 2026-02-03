'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function TermsPage() {
  const t = useTranslations('legal.terms');

  const sections = [
    { title: t('intro_title'), content: t('intro_text') },
    { title: t('services_title'), content: t('services_text') },
    { title: t('bookings_title'), content: t('bookings_text') },
    { title: t('liability_title'), content: t('liability_text') },
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
