'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets,
  CloudSnow,
  CloudLightning,
  Loader2
} from 'lucide-react';
import { useTranslations } from '@/lib/i18n/use-translations';

interface GlobeView {
  lat: number;
  lng: number;
  altitude: number;
}

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  cityName: string;
}

interface RegionWeatherWidgetProps {
  viewCenter: GlobeView | null;
  className?: string;
}

// Weather API enabled check (server handles API key)
const WEATHER_ENABLED = process.env.NEXT_PUBLIC_WEATHER_ENABLED !== 'false';

// Get weather icon component based on OWM icon code
function getWeatherIcon(iconCode: string) {
  const iconMap: Record<string, React.ReactNode> = {
    '01d': <Sun className="w-6 h-6 text-yellow-400" />,
    '01n': <Sun className="w-6 h-6 text-yellow-200" />,
    '02d': <Cloud className="w-6 h-6 text-gray-300" />,
    '02n': <Cloud className="w-6 h-6 text-gray-400" />,
    '03d': <Cloud className="w-6 h-6 text-gray-400" />,
    '03n': <Cloud className="w-6 h-6 text-gray-500" />,
    '04d': <Cloud className="w-6 h-6 text-gray-500" />,
    '04n': <Cloud className="w-6 h-6 text-gray-600" />,
    '09d': <CloudRain className="w-6 h-6 text-blue-400" />,
    '09n': <CloudRain className="w-6 h-6 text-blue-500" />,
    '10d': <CloudRain className="w-6 h-6 text-blue-400" />,
    '10n': <CloudRain className="w-6 h-6 text-blue-500" />,
    '11d': <CloudLightning className="w-6 h-6 text-yellow-500" />,
    '11n': <CloudLightning className="w-6 h-6 text-yellow-600" />,
    '13d': <CloudSnow className="w-6 h-6 text-blue-200" />,
    '13n': <CloudSnow className="w-6 h-6 text-blue-300" />,
    '50d': <Cloud className="w-6 h-6 text-gray-400" />,
    '50n': <Cloud className="w-6 h-6 text-gray-500" />,
  };
  
  return iconMap[iconCode] || <Cloud className="w-6 h-6 text-gray-400" />;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function RegionWeatherWidget({ viewCenter, className = '' }: RegionWeatherWidgetProps) {
  const t = useTranslations('weather');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce view center to avoid too many API calls
  const debouncedView = useDebounce(viewCenter, 1000);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    if (!WEATHER_ENABLED) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use our Edge API route (handles caching + API key server-side)
      const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch weather');
      }

      const data = await res.json();
      
      setWeather({
        temp: data.temp,
        feelsLike: data.feelsLike,
        humidity: data.humidity,
        windSpeed: data.windSpeed,
        description: data.description,
        icon: data.icon,
        cityName: data.cityName || t('unknownLocation'),
      });
    } catch {
      setError(t('fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (debouncedView) {
      fetchWeather(debouncedView.lat, debouncedView.lng);
    }
  }, [debouncedView, fetchWeather]);

  // Don't render if weather is disabled
  if (!WEATHER_ENABLED) return null;

  return (
    <AnimatePresence mode="wait">
      {viewCenter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 ${className}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {t('regionWeather')}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-2">
              <p className="text-xs text-white/40">{error}</p>
            </div>
          ) : weather ? (
            <motion.div
              key={weather.cityName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Location and main temp */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[120px]">
                    {weather.cityName}
                  </p>
                  <p className="text-xs text-white/50 capitalize">{weather.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(weather.icon)}
                  <span className="text-2xl font-bold text-white">{weather.temp}°</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <Thermometer className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <p className="text-xs text-white/60">{t('feelsLike')}</p>
                  <p className="text-sm font-medium text-white">{weather.feelsLike}°</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-white/60">{t('humidity')}</p>
                  <p className="text-sm font-medium text-white">{weather.humidity}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <Wind className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-xs text-white/60">{t('wind')}</p>
                  <p className="text-sm font-medium text-white">{weather.windSpeed}</p>
                </div>
              </div>

              {/* Diving recommendation */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <DivingConditions weather={weather} />
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-white/40">{t('rotateToSeeWeather')}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Component to show diving conditions based on weather
function DivingConditions({ weather }: { weather: WeatherData }) {
  const t = useTranslations('weather');
  
  // Simple diving condition assessment
  const getCondition = () => {
    const { temp, windSpeed, icon } = weather;
    
    // Bad conditions
    if (icon.includes('11') || icon.includes('13')) {
      return { level: 'poor', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    if (windSpeed > 30) {
      return { level: 'poor', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
    
    // Moderate conditions
    if (icon.includes('09') || icon.includes('10') || windSpeed > 20) {
      return { level: 'moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    if (temp < 10 || temp > 35) {
      return { level: 'moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    
    // Good conditions
    return { level: 'good', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  };

  const condition = getCondition();

  return (
    <div className={`flex items-center justify-between ${condition.bg} rounded-lg px-3 py-2`}>
      <span className="text-xs text-white/60">{t('divingConditions')}</span>
      <span className={`text-xs font-medium ${condition.color} capitalize`}>
        {t(`conditions.${condition.level}`)}
      </span>
    </div>
  );
}
