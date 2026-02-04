'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  Check, 
  ChevronRight, 
  Waves,
  Compass,
  Fish,
  Anchor,
  X,
  Search,
  Globe2,
  List
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useLocale } from '@/lib/i18n/locale-provider';

// Dynamic import for 3D component (no SSR)
const UnderwaterGlobe = dynamic(
  () => import('./underwater-globe').then(mod => mod.UnderwaterGlobe),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-950 to-black">
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <Compass className="w-full h-full text-cyan-400" />
          </motion.div>
          <p className="text-cyan-400/70 font-mono text-sm">{"..."}</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
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
}

interface DeepDiveExplorerProps {
  centers: Center[];
}

// Floating bubbles animation
function FloatingBubbles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-cyan-400/20"
          initial={{ 
            x: Math.random() * 100 + '%',
            y: '100%',
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: '-10%',
            x: `${Math.random() * 100}%`
          }}
          transition={{ 
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// Center Detail Card
function CenterDetailCard({ 
  center, 
  isSelected,
  onClick,
  getLocalizedName,
  getLocalizedDescription,
  t
}: { 
  center: Center;
  isSelected: boolean;
  onClick: () => void;
  getLocalizedName: (name: JsonValue) => string;
  getLocalizedDescription: (desc: JsonValue) => string;
  t: (key: string) => string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl cursor-pointer
        border transition-all duration-300
        ${isSelected 
          ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20' 
          : 'border-white/10 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10'}
      `}
    >
      {/* Glow effect when selected */}
      {isSelected && (
        <motion.div
          layoutId="selectedGlow"
          className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-cyan-400/10"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
      
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon/Indicator */}
          <div className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${isSelected ? 'bg-cyan-400/20' : 'bg-white/5'}
            transition-colors duration-300
          `}>
            {center.verified ? (
              <Anchor className="w-6 h-6 text-cyan-400" />
            ) : (
              <Fish className="w-6 h-6 text-blue-400" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white truncate">
                {getLocalizedName(center.name)}
              </h3>
              {center.verified && (
                <Badge variant="success" className="text-xs px-1.5 py-0">
                  <Check className="w-3 h-3" />
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-white/60 mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{center.city}, {center.country}</span>
            </div>
            
            {center.shortDescription ? (
              <p className="text-xs text-white/50 line-clamp-2 mb-2">
                {getLocalizedDescription(center.shortDescription)}
              </p>
            ) : null}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {center.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-white">
                      {center.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-white/40">
                  {center.reviewCount} reviews
                </span>
              </div>
              
              <span className="text-xs text-cyan-400">
                {center.serviceCount} {t('services')}
              </span>
            </div>
          </div>
          
          {/* Arrow */}
          <ChevronRight className={`
            w-5 h-5 transition-all duration-300
            ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-white/30'}
          `} />
        </div>
      </div>
    </motion.div>
  );
}

// Main Component
export function DeepDiveExplorer({ centers }: DeepDiveExplorerProps) {
  const t = useTranslations('centers.directory');
  const tExplorer = useTranslations('explorerPage');
  const tCommon = useTranslations('common');
  const tGlobe = useTranslations('globe');
  const { locale } = useLocale();
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'globe' | 'list'>('globe');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isGlobeView = viewMode === 'globe';
  const isListView = viewMode === 'list';

  const setGlobeView = () => setViewMode('globe');
  const setListView = () => {
    setViewMode('list');
    setIsPanelOpen(false);
  };

  const handleCenterSelect = useCallback((centerId: string | null) => {
    setSelectedCenter(centerId);
    if (centerId) {
      setIsPanelOpen(true);
    }
  }, []);
  
  const getLocalizedName = useCallback((name: JsonValue): string => {
    if (!name || typeof name !== 'object') return tCommon('unnamed');
    const obj = name as Record<string, string>;
    return String(obj[locale] || obj['en'] || obj['fr'] || Object.values(obj)[0] || tCommon('unnamed'));
  }, [locale, tCommon]);

  const getLocalizedDescription = useCallback((desc: JsonValue): string => {
    if (!desc || typeof desc !== 'object') return '';
    const obj = desc as Record<string, string>;
    return String(obj[locale] || obj['en'] || obj['fr'] || Object.values(obj)[0] || '');
  }, [locale]);
  
  // Filter centers by search
  const filteredCenters = useMemo(() => {
    if (!searchQuery) return centers;
    const query = searchQuery.toLowerCase();
    return centers.filter(center => {
      const name = getLocalizedName(center.name).toLowerCase();
      const city = center.city?.toLowerCase() || '';
      const country = center.country?.toLowerCase() || '';
      return name.includes(query) || city.includes(query) || country.includes(query);
    });
  }, [centers, searchQuery, getLocalizedName]);
  
  // Transform centers for globe
  const globeMarkers = useMemo(() => {
    return filteredCenters
      .filter(center => {
        // Only include centers with valid coordinates
        const lat = Number(center.latitude);
        const lng = Number(center.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(center => ({
        id: center.id,
        name: getLocalizedName(center.name),
        city: center.city || '',
        country: center.country || '',
        lat: Number(center.latitude),
        lng: Number(center.longitude),
        rating: center.rating,
        icon: (center.mapIcon || 'diver') as 'diver' | 'mask' | 'fins' | 'tank' | 'anchor' | 'wave',
        verified: center.verified
      }));
  }, [filteredCenters, getLocalizedName]);
  
  // Selected center details
  const selectedCenterData = useMemo(() => {
    return centers.find(c => c.id === selectedCenter);
  }, [centers, selectedCenter]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 via-blue-950 to-black">
      {/* Header */}
      <div className="relative z-10 pt-14 pb-6 px-4 sm:pt-20 sm:pb-8">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 mb-4"
            >
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">{tExplorer('title')}</span>
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </motion.div>
          
          {/* Search and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:hidden"
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tCommon('search')}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={isGlobeView ? 'default' : 'ghost'}
                size="icon"
                onClick={setGlobeView}
                className={isGlobeView ? 'bg-cyan-400 text-black' : 'text-white/60'}
              >
                <Globe2 className="w-5 h-5" />
              </Button>
              <Button
                variant={isListView ? 'default' : 'ghost'}
                size="icon"
                onClick={setListView}
                className={isListView ? 'bg-cyan-400 text-black' : 'text-white/60'}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-8 mt-6 text-sm text-white/40 lg:hidden"
          >
            <span>{tGlobe('centerCount', { count: filteredCenters.length })}</span>
            <span>{t('verified')}: <strong className="text-cyan-400">{filteredCenters.filter(c => c.verified).length}</strong></span>
          </motion.div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex-1">
        {isGlobeView ? (
          <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-[520px]">
            {/* 3D Globe */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="relative min-h-[280px] h-[40vh] sm:h-[50vh] lg:h-[65vh] lg:min-h-[520px]"
            >
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-pulse text-cyan-400">{tExplorer('loadingGlobe')}</div>
                  </div>
                }
              >
                <UnderwaterGlobe
                  centers={globeMarkers}
                  onCenterSelect={handleCenterSelect}
                  selectedCenter={selectedCenter}
                />
              </Suspense>

              {/* Instructions overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-xs text-white/40"
              >
                <span>{tGlobe('instructions')}</span>
              </motion.div>

              {/* Mini console */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80">
                <div className="rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-xl">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPanelOpen(true)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    >
                      <List className="mr-2 h-4 w-4" />
                      {t('listTitle')}
                    </Button>
                    {selectedCenterData && (
                      <Link href={`/centers/${selectedCenterData.slug}`}>
                        <Button className="w-full rounded-xl bg-cyan-400 text-black hover:bg-cyan-500">
                          {tCommon('explore')} {getLocalizedName(selectedCenterData.name)}
                        </Button>
                      </Link>
                    )}
                  </div>

                  {selectedCenterData && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-semibold text-white">
                        {getLocalizedName(selectedCenterData.name)}
                      </p>
                      <p className="text-xs text-white/50">
                        {selectedCenterData.city}, {selectedCenterData.country}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Popup panel */}
            <AnimatePresence>
              {isPanelOpen && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    aria-label={tCommon('close')}
                    onClick={() => setIsPanelOpen(false)}
                    className="absolute inset-0 bg-black/60"
                  />
                  <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 40, opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="relative w-full sm:w-[420px] h-[70vh] sm:h-full bg-black/75 backdrop-blur-xl border-t border-white/10 sm:border-l sm:border-t-0 flex flex-col"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center gap-2">
                      <Fish className="w-5 h-5 text-cyan-400" />
                      <h2 className="font-semibold text-white">{t('listTitle')}</h2>
                      <Badge variant="outline" className="ml-auto text-cyan-400 border-cyan-400/30">
                        {filteredCenters.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsPanelOpen(false)}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="border-b border-white/10 p-4 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={tCommon('search')}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-cyan-400"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant={isGlobeView ? 'default' : 'ghost'}
                            size="icon"
                            onClick={setGlobeView}
                            className={isGlobeView ? 'bg-cyan-400 text-black' : 'text-white/60'}
                          >
                            <Globe2 className="w-5 h-5" />
                          </Button>
                          <Button
                            variant={isListView ? 'default' : 'ghost'}
                            size="icon"
                            onClick={setListView}
                            className={isListView ? 'bg-cyan-400 text-black' : 'text-white/60'}
                          >
                            <List className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="text-xs text-white/50">
                          {tGlobe('centerCount', { count: filteredCenters.length })} · {t('verified')}:{' '}
                          <span className="text-cyan-400">{filteredCenters.filter(c => c.verified).length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <AnimatePresence mode="popLayout">
                        {filteredCenters.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8"
                          >
                            <Waves className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <p className="text-white/40">{tExplorer('noResults')}</p>
                          </motion.div>
                        ) : (
                          filteredCenters.map((center) => (
                            <CenterDetailCard
                              key={center.id}
                              center={center}
                              isSelected={selectedCenter === center.id}
                              onClick={() => handleCenterSelect(
                                selectedCenter === center.id ? null : center.id
                              )}
                              getLocalizedName={getLocalizedName}
                              getLocalizedDescription={getLocalizedDescription}
                              t={t}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {selectedCenterData && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="p-4 border-t border-white/10 bg-cyan-400/5"
                        >
                          <Link href={`/centers/${selectedCenterData.slug}`}>
                            <Button className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-semibold">
                              {tCommon('explore')} {getLocalizedName(selectedCenterData.name)}
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <div className="container-custom py-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredCenters.map((center) => (
                <motion.div
                  key={center.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <Link href={`/centers/${center.slug}`}>
                    <Card className="h-full overflow-hidden bg-white/5 border-white/10 hover:border-cyan-400/50 transition-all duration-300 group">
                      <div className="relative h-40 bg-gradient-to-br from-cyan-900/50 to-blue-950/50 overflow-hidden">
                        <FloatingBubbles />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Anchor className="w-12 h-12 text-cyan-400/30 group-hover:text-cyan-400/50 transition-colors" />
                        </div>
                        {center.verified && (
                          <Badge variant="success" className="absolute top-3 right-3 gap-1">
                            <Check className="w-3 h-3" />
                            {t('verified')}
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {getLocalizedName(center.name)}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-sm text-white/50 mb-2">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{center.city}, {center.country}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {center.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-white">{center.rating.toFixed(1)}</span>
                              <span className="text-xs text-white/40">({center.reviewCount})</span>
                            </div>
                          )}
                          <span className="text-xs text-cyan-400">{center.serviceCount} {t('services')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
