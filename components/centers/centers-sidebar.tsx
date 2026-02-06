'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Star, 
  Check, 
  Waves,
  Anchor,
  ChevronRight,
  Navigation
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useLocale } from '@/lib/i18n/locale-provider';
import { RegionWeatherWidget } from './region-weather-widget';

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
  distance?: number; // Distance from view center in km
}

interface GlobeView {
  lat: number;
  lng: number;
  altitude: number;
}

interface CentersSidebarProps {
  centers: Center[];
  viewCenter: GlobeView | null;
  selectedCenter: string | null;
  onCenterSelect: (id: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Haversine formula to calculate distance between two points
function haversineDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get region name from coordinates (simplified)
function getRegionName(lat: number, lng: number): string {
  // Simplified region detection
  if (lat > 50) {
    if (lng > -30 && lng < 40) return 'Northern Europe';
    if (lng >= 40 && lng < 100) return 'Northern Asia';
    return 'North America';
  }
  if (lat > 20) {
    if (lng > -30 && lng < 40) return 'Europe';
    if (lng >= 40 && lng < 100) return 'Asia';
    if (lng >= 100) return 'East Asia';
    return 'North America';
  }
  if (lat > -10) {
    if (lng > -30 && lng < 60) return 'Africa / Middle East';
    if (lng >= 60 && lng < 120) return 'Southeast Asia';
    if (lng > -120 && lng < -30) return 'Central America / Caribbean';
    return 'Oceania';
  }
  if (lat > -40) {
    if (lng > -80 && lng < 0) return 'South America';
    if (lng >= 100 && lng < 180) return 'Oceania / Australia';
    return 'Indian Ocean';
  }
  return 'Antarctica Region';
}

export function CentersSidebar({
  centers,
  viewCenter,
  selectedCenter,
  onCenterSelect,
  searchQuery,
  onSearchChange,
}: CentersSidebarProps) {
  const t = useTranslations('centers.directory');
  const tCommon = useTranslations('common');
  const { locale } = useLocale();

  const getLocalizedName = useCallback((name: JsonValue): string => {
    if (!name || typeof name !== 'object') return tCommon('unnamed');
    const obj = name as Record<string, string>;
    return String(obj[locale] || obj['en'] || obj['fr'] || Object.values(obj)[0] || tCommon('unnamed'));
  }, [locale, tCommon]);

  // Filter and sort centers by distance from view center
  const visibleCenters = useMemo(() => {
    if (!viewCenter) return centers.slice(0, 10);

    // Calculate max distance based on altitude (zoom level)
    // Lower altitude = more zoomed in = smaller radius
    const maxDistance = Math.min(8000, viewCenter.altitude * 2000);

    const centersWithDistance = centers
      .filter(center => {
        const lat = Number(center.latitude);
        const lng = Number(center.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
      .map(center => ({
        ...center,
        distance: haversineDistance(
          viewCenter.lat,
          viewCenter.lng,
          Number(center.latitude),
          Number(center.longitude)
        ),
      }))
      .filter(c => c.distance <= maxDistance);

    // Apply search filter
    let filtered = centersWithDistance;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = centersWithDistance.filter(center => {
        const name = getLocalizedName(center.name).toLowerCase();
        const city = center.city?.toLowerCase() || '';
        const country = center.country?.toLowerCase() || '';
        return name.includes(query) || city.includes(query) || country.includes(query);
      });
    }

    // Sort by distance
    return filtered.sort((a, b) => a.distance - b.distance).slice(0, 15);
  }, [centers, viewCenter, searchQuery, getLocalizedName]);

  // Current region name
  const regionName = viewCenter ? getRegionName(viewCenter.lat, viewCenter.lng) : null;

  // Stats for visible region
  const stats = useMemo(() => ({
    total: visibleCenters.length,
    verified: visibleCenters.filter(c => c.verified).length,
    countries: new Set(visibleCenters.map(c => c.country)).size,
  }), [visibleCenters]);

  const gradients = [
    'from-cyan-900/50 to-blue-950/50',
    'from-emerald-900/50 to-slate-900/50',
    'from-blue-900/50 to-slate-900/50',
    'from-purple-900/50 to-slate-900/50',
  ];

  return (
    <div className="h-full flex flex-col bg-black/80 backdrop-blur-xl border-l border-white/10">
      {/* Header with region info */}
      <div className="p-4 border-b border-white/10">
        {regionName && (
          <motion.div
            key={regionName}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">{regionName}</span>
          </motion.div>
        )}

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tCommon('searchDestination')}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-3 text-xs">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-400">{stats.total}</div>
            <div className="text-white/50">{t('centersLabel')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{stats.verified}</div>
            <div className="text-white/50">{t('verified')}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{stats.countries}</div>
            <div className="text-white/50">{tCommon('countries')}</div>
          </div>
        </div>

        {/* Weather widget */}
        <RegionWeatherWidget viewCenter={viewCenter} className="mt-4" />
      </div>

      {/* Centers list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleCenters.map((center, index) => (
            <motion.div
              key={center.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`overflow-hidden bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50 transition-all duration-200 cursor-pointer ${
                  selectedCenter === center.id ? 'border-cyan-500 ring-1 ring-cyan-500/50' : ''
                }`}
                onClick={() => onCenterSelect(center.id === selectedCenter ? null : center.id)}
              >
                <div className={`h-20 bg-gradient-to-br ${gradients[index % gradients.length]} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Anchor className="w-8 h-8 text-cyan-400/30" />
                  </div>
                  {center.verified && (
                    <Badge variant="success" className="absolute top-2 right-2 gap-1 text-xs">
                      <Check className="w-3 h-3" />
                    </Badge>
                  )}
                  {center.distance !== undefined && (
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white/80">
                      {center.distance < 100 
                        ? `${Math.round(center.distance)} km` 
                        : `${Math.round(center.distance / 100) * 100} km`
                      }
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-white mb-1 line-clamp-1">
                    {getLocalizedName(center.name)}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-xs text-white/50 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{center.city}, {center.country}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {center.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-white">{center.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/40">{tCommon('noReviews')}</span>
                    )}
                    
                    <Link 
                      href={`/centers/${center.slug}`}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tCommon('viewDetails')}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {visibleCenters.length === 0 && (
          <div className="text-center py-8">
            <Waves className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {searchQuery ? t('noSearchResults') : t('rotateGlobe')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
