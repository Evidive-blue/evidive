'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass,
  Globe as GlobeIcon,
  List,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useLocale } from '@/lib/i18n/locale-provider';
import { CentersSidebar } from './centers-sidebar';

// Dynamic import for 3D globe component (no SSR)
const PremiumGlobe = dynamic(
  () => import('./premium-globe').then(mod => mod.PremiumGlobe),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Compass className="w-full h-full text-cyan-400" />
          </motion.div>
        </div>
      </div>
    )
  }
);

type JsonValue = unknown;

interface Center {
  id: string;
  slug: string;
  name: JsonValue;
  shortDescription: JsonValue;
  city: string;
  country: string;
  latitude: JsonValue;
  longitude: JsonValue;
  verified: boolean;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  mapIcon?: string;
  featuredImage?: string | null;
  logoUrl?: string | null;
}

interface GlobeView {
  lat: number;
  lng: number;
  altitude: number;
}

interface DeepDiveExplorerProps {
  centers: Center[];
}

// Main Component
export function DeepDiveExplorer({ centers }: DeepDiveExplorerProps) {
  const t = useTranslations('centers.directory');
  const tExplorer = useTranslations('explorerPage');
  const tCommon = useTranslations('common');
  const { locale } = useLocale();
  
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewCenter, setViewCenter] = useState<GlobeView | null>(null);
  const [mobileView, setMobileView] = useState<'globe' | 'list'>('globe');

  const handleCenterSelect = useCallback((centerId: string | null) => {
    setSelectedCenter(centerId);
  }, []);

  const handleViewChange = useCallback((view: GlobeView) => {
    setViewCenter(view);
  }, []);
  
  const getLocalizedName = useCallback((name: JsonValue): string => {
    if (!name || typeof name !== 'object') return tCommon('unnamed');
    const obj = name as Record<string, string>;
    return String(obj[locale] || obj['en'] || obj['fr'] || Object.values(obj)[0] || tCommon('unnamed'));
  }, [locale, tCommon]);
  
  // Transform centers for globe
  const globeMarkers = useMemo(() => {
    console.log(`[Globe] Total centers received: ${centers.length}`);
    
    const filtered = centers.filter(center => {
      // Vérifier que les coordonnées existent et sont valides
      if (center.latitude === null || center.latitude === undefined ||
          center.longitude === null || center.longitude === undefined) {
        console.log(`[Globe] Center "${center.slug}" skipped: missing coordinates`);
        return false;
      }
      
      const lat = Number(center.latitude);
      const lng = Number(center.longitude);
      
      // Valider les coordonnées (permettre 0,0 si c'est intentionnel mais rare)
      const isValid = !isNaN(lat) && !isNaN(lng) && 
                      lat >= -90 && lat <= 90 && 
                      lng >= -180 && lng <= 180;
      
      if (!isValid) {
        console.log(`[Globe] Center "${center.slug}" skipped: invalid coords (${lat}, ${lng})`);
      }
      
      return isValid;
    });
    
    console.log(`[Globe] Centers with valid coordinates: ${filtered.length}`);
    
    return filtered
      .map(center => ({
        id: center.id,
        slug: center.slug,
        name: getLocalizedName(center.name),
        description: getLocalizedName(center.shortDescription),
        city: center.city || '',
        country: center.country || '',
        lat: Number(center.latitude),
        lng: Number(center.longitude),
        rating: center.rating,
        reviewCount: center.reviewCount,
        icon: (center.mapIcon || 'diver') as 'diver' | 'mask' | 'fins' | 'tank' | 'anchor' | 'wave',
        verified: center.verified,
        image: center.featuredImage || center.logoUrl || null,
      }));
  }, [centers, getLocalizedName]);

  // Stats
  const totalCenters = centers.length;
  const countriesCount = useMemo(() => new Set(centers.map(c => c.country)).size, [centers]);
  
  return (
    <div className="h-screen pt-16 bg-black flex flex-col">
      {/* Header - minimal, shows stats */}
      <header className="flex-shrink-0 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xs text-white/50">
              {totalCenters} {t('centersLabel')} • {countriesCount} {tCommon('countries')}
            </p>
          </div>
          
          {/* Mobile toggle */}
          <div className="flex lg:hidden items-center gap-1 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setMobileView('globe')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                mobileView === 'globe' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-white/50 hover:text-white/70'
              }`}
              aria-label="Show globe"
            >
              <GlobeIcon className="w-4 h-4" />
              <span className="text-xs font-medium">{tCommon('globe')}</span>
            </button>
            <button
              onClick={() => setMobileView('list')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                mobileView === 'list' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-white/50 hover:text-white/70'
              }`}
              aria-label="Show list"
            >
              <List className="w-4 h-4" />
              <span className="text-xs font-medium">{t('centersLabel')}</span>
              {totalCenters > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                  {totalCenters > 99 ? '99+' : totalCenters}
                </span>
              )}
            </button>
          </div>

          {/* Desktop: Reset view button */}
          <button
            onClick={() => setViewCenter(null)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {tCommon('reset')}
          </button>
        </div>
      </header>

      {/* Main content - Split view */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop: Always show both */}
        <div className="hidden lg:flex lg:flex-1">
          {/* Globe section - 60% on desktop */}
          <div className="relative bg-black flex-[6]">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="animate-pulse text-cyan-400">{tExplorer('loadingGlobe')}</div>
                </div>
              }
            >
              <PremiumGlobe
                centers={globeMarkers}
                onCenterSelect={handleCenterSelect}
                selectedCenter={selectedCenter}
                onViewChange={handleViewChange}
                compact={true}
              />
            </Suspense>

            {/* Globe instructions overlay */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: viewCenter ? 0 : 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/60">
                {t('globeHint')}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - 40% on desktop */}
          <div className="flex-[4] max-w-md">
            <CentersSidebar
              centers={centers}
              viewCenter={viewCenter}
              selectedCenter={selectedCenter}
              onCenterSelect={handleCenterSelect}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Mobile: Animated view switching */}
        <div className="lg:hidden flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {mobileView === 'globe' ? (
              <motion.div
                key="globe-mobile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black"
              >
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <div className="animate-pulse text-cyan-400">{tExplorer('loadingGlobe')}</div>
                    </div>
                  }
                >
                  <PremiumGlobe
                    centers={globeMarkers}
                    onCenterSelect={handleCenterSelect}
                    selectedCenter={selectedCenter}
                    onViewChange={handleViewChange}
                    compact={true}
                  />
                </Suspense>

                {/* Globe instructions overlay */}
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: viewCenter ? 0 : 1 }}
                  transition={{ delay: 2, duration: 1 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-none"
                >
                  <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/60">
                    {t('globeHint')}
                  </div>
                </motion.div>

                {/* Swipe indicator to see list */}
                <button
                  onClick={() => setMobileView('list')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-l-xl px-2 py-4 text-white/60 hover:text-white hover:bg-black/80 transition-all group"
                  aria-label={t('centersLabel')}
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="list-mobile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <CentersSidebar
                  centers={centers}
                  viewCenter={viewCenter}
                  selectedCenter={selectedCenter}
                  onCenterSelect={handleCenterSelect}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {/* Swipe indicator to see globe */}
                <button
                  onClick={() => setMobileView('globe')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm rounded-r-xl px-2 py-4 text-white/60 hover:text-white hover:bg-black/80 transition-all group z-10"
                  aria-label={tCommon('globe')}
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
