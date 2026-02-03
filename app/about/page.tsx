'use client';

import { motion } from 'framer-motion';
import { Shield, Heart, Star, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function AboutPage() {
  const t = useTranslations('about');

  const values = [
    {
      key: 'trust',
      icon: Shield,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      key: 'safety',
      icon: Heart,
      gradient: 'from-red-500 to-pink-500',
    },
    {
      key: 'experience',
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      key: 'community',
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const timeline = [
    { year: '2023', event: t('story.timeline.idea') },
    { year: '2024', event: t('story.timeline.launch') },
    { year: '2025', event: t('story.timeline.expansion') },
    { year: '2026', event: t('story.timeline.partners') },
  ];

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-24 lg:py-32 ocean-gradient-hero">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-white/80">
              {t('hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {t('mission.title')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('mission.description')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('values.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('values.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-4`}
                    >
                      <value.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t(`values.items.${value.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`values.items.${value.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t('story.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('story.subtitle')}
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-ocean-surface to-ocean-abyss" />

              {/* Timeline Items */}
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative pl-12 pb-8 last:pb-0"
                >
                  {/* Dot */}
                  <div className="absolute left-0 w-9 h-9 rounded-full bg-background border-4 border-ocean-surface flex items-center justify-center">
                    <span className="text-xs font-bold text-ocean-surface">
                      {item.year.slice(2)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="glass rounded-xl p-4">
                    <span className="text-sm text-ocean-surface font-medium">
                      {item.year}
                    </span>
                    <p className="mt-1">{item.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 lg:py-32 ocean-gradient-dark">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('team.title')}
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {t('team.description')}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
