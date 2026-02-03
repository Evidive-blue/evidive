'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function SitemapPage() {
  const t = useTranslations('sitemap');

  const sections = [
    {
      key: 'main',
      links: ['home', 'about', 'contact'],
    },
    {
      key: 'explore',
      links: ['explorer', 'centers'],
    },
    {
      key: 'business',
      links: ['onboard', 'careers'],
    },
    {
      key: 'legal',
      links: ['terms', 'privacy'],
    },
  ];

  const linkHrefs: Record<string, string> = {
    home: '/',
    about: '/about',
    contact: '/contact',
    explorer: '/explorer',
    centers: '/centers',
    login: '/login',
    register: '/register',
    dashboard: '/dashboard',
    profile: '/profile',
    settings: '/settings',
    onboard: '/register?type=center',
    careers: '/careers',
    terms: '/terms',
    privacy: '/privacy',
  };

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 lg:py-24 ocean-gradient-hero">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-white/70">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="container-custom max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{t(`sections.${section.key}`)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.links.map((link) => (
                      <Link
                        key={link}
                        href={linkHrefs[link] || `/${link}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div>
                          <div className="font-medium">{t(`links.${link}`)}</div>
                          <div className="text-sm text-muted-foreground">
                            {t(`descriptions.${link}`)}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            {t('lastUpdated')}: {new Date().toLocaleDateString()}
          </motion.p>
        </div>
      </section>
    </div>
  );
}
