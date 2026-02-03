'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, Users, Lightbulb, Globe, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function CareersPage() {
  const t = useTranslations('careers');

  const values = [
    { key: 'passion', icon: Heart, gradient: 'from-red-500 to-pink-500' },
    { key: 'team', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { key: 'innovation', icon: Lightbulb, gradient: 'from-yellow-500 to-orange-500' },
    { key: 'impact', icon: Globe, gradient: 'from-green-500 to-emerald-500' },
  ];

  const benefits = ['diving', 'remote', 'flexibility', 'health'];

  const positions = ['fullstack', 'marketing', 'support'];

  return (
    <div className="pt-16 min-h-screen bg-background">
      {/* Hero */}
      <section className="py-24 lg:py-32 ocean-gradient-hero">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge variant="ocean" className="mb-4">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-white/80">
              {t('subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            {t('valuesTitle')}
          </motion.h2>

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
                      {t(`values.${value.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`values.${value.key}.description`)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            {t('benefitsTitle')}
          </motion.h2>

          <div className="flex flex-wrap justify-center gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-base"
                >
                  {t(`benefits.${benefit}`)}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Positions */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container-custom">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-12"
          >
            {t('positionsTitle')}
          </motion.h2>

          <div className="max-w-2xl mx-auto space-y-4">
            {positions.map((position, index) => (
              <motion.div
                key={position}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="card-hover">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">
                        {t(`positions.${position}.title`)}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {t(`positions.${position}.department`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {t(`positions.${position}.location`)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ocean" size="sm" className="gap-2">
                      {t('applyButton')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 ocean-gradient-dark">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-white/70 mb-8">
              {t('cta.description')}
            </p>
            <Link href="/contact">
              <Button variant="ocean" size="lg">
                {t('cta.button')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
