'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    setSent(true);
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
        <div className="container-custom">
          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6 lg:p-8">
                  {sent ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{t('success')}</h3>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('name')}
                        </label>
                        <Input required placeholder={t('placeholders.name')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('email')}
                        </label>
                        <Input type="email" required placeholder={t('placeholders.email')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('subject')}
                        </label>
                        <Input required placeholder={t('placeholders.subject')} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('message')}
                        </label>
                        <textarea
                          required
                          rows={5}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          placeholder={t('placeholders.message')}
                        />
                      </div>
                      <Button type="submit" variant="ocean" className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        {t('send')}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">{t('info_title')}</h3>
                  <div className="space-y-4">
                    <a
                      href={`mailto:${t('info_email')}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-5 w-5" />
                      {t('info_email')}
                    </a>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      {t('info_address')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card className="overflow-hidden">
                <div className="h-64 bg-gradient-to-br from-ocean-surface to-ocean-deep flex items-center justify-center">
                  <span className="text-6xl opacity-30">🗺️</span>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
