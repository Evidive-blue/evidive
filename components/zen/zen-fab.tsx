'use client';

import { motion } from 'framer-motion';
import { Waves } from 'lucide-react';
import { useZenStore } from '@/stores';
import { useTranslations } from '@/lib/i18n/use-translations';

export function ZenFab() {
  const openZen = useZenStore((state) => state.openZen);
  const t = useTranslations('zen');

  return (
    <motion.button
      onClick={openZen}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-shadow hover:shadow-cyan-500/50"
      aria-label={t('zenMode')}
      title={t('zenMode')}
    >
      <Waves className="h-6 w-6" />
    </motion.button>
  );
}
