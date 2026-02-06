'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Maximize2, Volume2 } from 'lucide-react';
import { useZenStore } from '@/stores';
import { useTranslations } from '@/lib/i18n/use-translations';

export function ZenFab() {
  const { openZen, enableSoundOnly, isSoundOnly } = useZenStore();
  const t = useTranslations('zen');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide FAB when sound-only mode is active (mini player takes over)
  if (isSoundOnly) return null;

  const handleFullZen = () => {
    setIsMenuOpen(false);
    openZen();
  };

  const handleSoundOnly = () => {
    setIsMenuOpen(false);
    enableSoundOnly();
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40">
      {/* Menu options */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2"
          >
            {/* Full Zen Mode */}
            <motion.button
              onClick={handleFullZen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 whitespace-nowrap rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
            >
              <Maximize2 className="h-4 w-4" />
              {t('fullZenMode')}
            </motion.button>

            {/* Ambient Sounds Only */}
            <motion.button
              onClick={handleSoundOnly}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 whitespace-nowrap rounded-full bg-gradient-to-br from-cyan-700/90 to-blue-800/90 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              <Volume2 className="h-4 w-4" />
              {t('ambientSounds')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1, rotate: isMenuOpen ? 45 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-shadow hover:shadow-cyan-500/50"
        aria-label={t('zenMode')}
        title={t('zenMode')}
        aria-expanded={isMenuOpen}
      >
        <Waves className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
