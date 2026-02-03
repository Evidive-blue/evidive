'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n/use-translations';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="pt-16 min-h-screen flex items-center justify-center ocean-gradient-hero">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center"
        >
          {/* 404 Number */}
          <div className="text-9xl font-bold text-gradient mb-4">404</div>

          {/* Message */}
          <h1 className="text-2xl font-semibold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-white/70 mb-8">
            {t('description')}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="ocean" className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                {t('backHome')}
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('goBack')}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
