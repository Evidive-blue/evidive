'use client';

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Thermometer, Cloud, Wind, ExternalLink, Waves } from 'lucide-react';

// Import types from react-globe.gl
import type { GlobeMethods as ReactGlobeGlobeMethods } from 'react-globe.gl';

// Dynamic import to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="animate-pulse text-cyan-400">Loading globe...</div>
    </div>
  ),
});

// Icon types for dive centers
type CenterIconType = 'diver' | 'mask' | 'fins' | 'tank' | 'anchor' | 'wave';

interface CenterMarker {
  id: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  icon: CenterIconType;
  image: string | null;
}

interface GlobeView {
  lat: number;
  lng: number;
  altitude: number;
}

interface PremiumGlobeProps {
  centers: CenterMarker[];
  onCenterSelect: (id: string | null) => void;
  selectedCenter: string | null;
  onViewChange?: (view: GlobeView) => void;
  compact?: boolean; // For split-view layout
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

// SVG paths for each icon type
const iconPaths: Record<CenterIconType, string> = {
  diver: 'M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M21 9H15V22H13V16H11V22H9V9H3V7H21V9Z',
  mask: 'M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19S21.27 15.89 23 11.5C21.27 7.11 17 4 12 4M12 16.5C9.24 16.5 7 14.26 7 11.5S9.24 6.5 12 6.5 17 8.74 17 11.5 14.76 16.5 12 16.5M12 8.5C10.34 8.5 9 9.84 9 11.5S10.34 14.5 12 14.5 15 13.16 15 11.5 13.66 8.5 12 8.5Z',
  fins: 'M20.5 11H19V7C19 5.9 18.1 5 17 5H13V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V5H6C4.9 5 4 5.9 4 7V11H2.5C1.67 11 1 11.67 1 12.5S1.67 14 2.5 14H4V18C4 19.1 4.9 20 6 20H10V21.5C10 22.33 10.67 23 11.5 23S13 22.33 13 21.5V20H17C18.1 20 19 19.1 19 18V14H20.5C21.33 14 22 13.33 22 12.5S21.33 11 20.5 11Z',
  tank: 'M17 4H15V2H9V4H7C5.9 4 5 4.9 5 6V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V6C19 4.9 18.1 4 17 4M12 18C10.34 18 9 16.66 9 15V9C9 7.34 10.34 6 12 6S15 7.34 15 9V15C15 16.66 13.66 18 12 18Z',
  anchor: 'M17 15L19 17L17 19L15 17L17 15M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M12 8C14.21 8 16 9.79 16 12H14C14 10.9 13.1 10 12 10S10 10.9 10 12H8C8 9.79 9.79 8 12 8M12 14V22H10V14H7L12 9L17 14H14V22H12Z',
  wave: 'M2 12C2 12 5 8 9 8S16 12 16 12 19 16 23 16V18C19 18 16 14 16 14S13 10 9 10 2 14 2 14V12M2 18C2 18 5 14 9 14S16 18 16 18 19 22 23 22V20C19 20 16 16 16 16S13 12 9 12 2 16 2 16V18Z',
};

// High-quality NASA Earth textures
const EARTH_DAY_IMG = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_TOPOLOGY_IMG = '//unpkg.com/three-globe/example/img/earth-topology.png';

// OpenWeatherMap API key (from environment)
const OWM_API_KEY = process.env.NEXT_PUBLIC_OWM_API_KEY || '';


// Fetch weather data from OpenWeatherMap
async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  if (!OWM_API_KEY) return null;
  
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OWM_API_KEY}`
    );
    if (!res.ok) return null;
    
    const data = await res.json();
    return {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
      feelsLike: Math.round(data.main.feels_like),
    };
  } catch {
    return null;
  }
}

// Center Info Popup Component - Memoized for performance
const CenterPopup = memo(function CenterPopup({ 
  center, 
  weather, 
  loading,
  onClose 
}: { 
  center: CenterMarker; 
  weather: WeatherData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const iconType = center.icon || 'diver';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw]"
    >
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden">
        {/* Header with image */}
        <div className="relative h-32 bg-gradient-to-br from-cyan-900 to-blue-950">
          {center.image ? (
            <Image
              src={center.image}
              alt={center.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cyan-400/30">
                <path d={iconPaths[iconType]} />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          
          {/* Icon badge */}
          <div className="absolute bottom-3 left-4">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${center.verified ? 'bg-emerald-500' : 'bg-cyan-500'}
              shadow-lg
            `}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d={iconPaths[iconType]} />
              </svg>
            </div>
          </div>
          
          {/* Rating badge */}
          {center.rating > 0 && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-semibold">{center.rating.toFixed(1)}</span>
              <span className="text-white/60 text-sm">({center.reviewCount})</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-1">{center.name}</h3>
          <div className="flex items-center gap-1 text-cyan-400 text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{center.city}, {center.country}</span>
          </div>
          
          {/* Description */}
          {center.description && (
            <p className="text-white/70 text-sm mb-3 line-clamp-2">
              {center.description}
            </p>
          )}
          
          {/* Weather section */}
          <div className="bg-black/40 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
              <Cloud className="w-3 h-3" />
              <span>Current Weather</span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
              </div>
            ) : weather ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span className="text-xl font-bold text-white">{weather.temp}°</span>
                  </div>
                  <div className="text-white/50 text-xs">Feels {weather.feelsLike}°</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Waves className="w-4 h-4 text-blue-400" />
                    <span className="text-lg font-semibold text-white">{weather.humidity}%</span>
                  </div>
                  <div className="text-white/50 text-xs">Humidity</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    <span className="text-lg font-semibold text-white">{weather.windSpeed}</span>
                  </div>
                  <div className="text-white/50 text-xs">km/h</div>
                </div>
              </div>
            ) : (
              <div className="text-white/40 text-sm text-center py-2">
                Weather unavailable
              </div>
            )}
          </div>
          
          {/* Action button */}
          <Link 
            href={`/centers/${center.slug}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl transition-all"
          >
            <span>View Center</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
});

export function PremiumGlobe({ 
  centers, 
  onCenterSelect, 
  selectedCenter,
  onViewChange,
  compact = false
}: PremiumGlobeProps) {
  const globeRef = useRef<ReactGlobeGlobeMethods | undefined>(undefined);
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const lastViewRef = useRef<GlobeView | null>(null);

  // Get selected center data
  const selectedCenterData = useMemo(() => 
    centers.find(c => c.id === selectedCenter) || null,
    [centers, selectedCenter]
  );

  // Fetch weather when center is selected
  useEffect(() => {
    if (selectedCenterData) {
      setWeatherLoading(true);
      fetchWeather(selectedCenterData.lat, selectedCenterData.lng)
        .then(data => {
          setWeather(data);
          setWeatherLoading(false);
        });
    } else {
      setWeather(null);
    }
  }, [selectedCenterData]);


  // Configure globe on ready
  useEffect(() => {
    if (globeRef.current && globeReady) {
      const globe = globeRef.current;
      
      // Auto-rotate only when not in compact mode
      globe.controls().autoRotate = !compact;
      globe.controls().autoRotateSpeed = 0.15;
      globe.controls().enableZoom = true;
      globe.controls().minDistance = compact ? 150 : 120;
      globe.controls().maxDistance = compact ? 350 : 400;
      globe.pointOfView({ lat: 30, lng: 10, altitude: compact ? 2.5 : 2.2 }, 0);

      // Track view changes for filtering centers by region
      const handleViewChange = () => {
        if (!onViewChange) return;
        
        const pov = globe.pointOfView();
        const newView: GlobeView = {
          lat: pov.lat,
          lng: pov.lng,
          altitude: pov.altitude,
        };
        
        // Debounce: only emit if significantly changed
        const last = lastViewRef.current;
        if (!last || 
            Math.abs(last.lat - newView.lat) > 2 || 
            Math.abs(last.lng - newView.lng) > 2 ||
            Math.abs(last.altitude - newView.altitude) > 0.1
        ) {
          lastViewRef.current = newView;
          onViewChange(newView);
        }
      };

      // Listen to control changes
      const controls = globe.controls();
      controls.addEventListener('change', handleViewChange);
      
      // Emit initial view
      setTimeout(() => handleViewChange(), 500);

      // Add ambient light for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      globe.scene().add(ambientLight);
    }
  }, [globeReady, compact, onViewChange]);

  // HTML element for markers (with integrated click/hover handlers)
  const getMarkerElement = useCallback((d: CenterMarker) => {
    const el = document.createElement('div');
    const isSelected = d.id === selectedCenter;
    const isHovered = d.id === hoveredCenter;
    const iconType = d.icon || 'diver';
    
    el.innerHTML = `
      <div class="marker-inner" style="
        width: ${isSelected ? '44px' : isHovered ? '38px' : '32px'};
        height: ${isSelected ? '44px' : isHovered ? '38px' : '32px'};
        border-radius: 50%;
        background: ${d.verified ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #06b6d4, #0284c7)'};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 ${isSelected ? '20px' : '12px'} ${d.verified ? 'rgba(16, 185, 129, 0.6)' : 'rgba(6, 182, 212, 0.6)'};
        transition: all 0.2s ease;
        cursor: pointer;
        border: 2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.3)'};
      ">
        <svg viewBox="0 0 24 24" style="width: 60%; height: 60%; fill: white;">
          <path d="${iconPaths[iconType]}"/>
        </svg>
      </div>
    `;
    
    // Add click handler
    el.addEventListener('click', () => {
      onCenterSelect(selectedCenter === d.id ? null : d.id);
      // Zoom to center
      if (globeRef.current && selectedCenter !== d.id) {
        globeRef.current.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.5 }, 1000);
      }
    });
    
    // Add hover handlers
    el.addEventListener('mouseenter', () => {
      setHoveredCenter(d.id);
      document.body.style.cursor = 'pointer';
    });
    
    el.addEventListener('mouseleave', () => {
      setHoveredCenter(null);
      document.body.style.cursor = 'default';
    });
    
    return el;
  }, [selectedCenter, hoveredCenter, onCenterSelect]);

  // Ripples for selected centers
  const ringsData = centers
    .filter(c => c.id === selectedCenter || c.id === hoveredCenter)
    .map(c => ({
      lat: c.lat,
      lng: c.lng,
      maxR: c.id === selectedCenter ? 5 : 3,
      propagationSpeed: 4,
      repeatPeriod: 700,
    }));

  return (
    <div className="w-full h-full bg-black relative">
      <Globe
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        
        // Globe appearance - day texture with bump map
        globeImageUrl={EARTH_DAY_IMG}
        bumpImageUrl={EARTH_TOPOLOGY_IMG}
        
        // Atmosphere - disabled to avoid veil effect
        showAtmosphere={false}
        atmosphereColor="#4488ff"
        atmosphereAltitude={0.15}
        
        // Night overlay polygon - disabled to avoid z-fighting artifacts
        // The night shader on city lights provides sufficient day/night contrast
        polygonsData={[]}
        
        // Terminator line disabled - was causing flashing artifacts
        arcsData={[]}
        
        // HTML markers (custom icons for dive centers)
        htmlElementsData={centers}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.025}
        htmlElement={getMarkerElement as (d: object) => HTMLElement}
        
        // Ripple rings on selection
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(6, 182, 212, ${1 - t})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        
        // PERFORMANCE: Optimized for better FPS with reduced z-fighting
        rendererConfig={{ 
          antialias: true, // Enable antialiasing to reduce edge artifacts
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          // Use logarithmic depth buffer to reduce z-fighting
          logarithmicDepthBuffer: true,
          // Limit pixel ratio for performance
          pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
        } as Record<string, unknown>}
        width={typeof window !== 'undefined' ? window.innerWidth : 1920}
        height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        animateIn={false}
      />
      
      {/* Center popup - positioned higher to not conflict with search bar */}
      <AnimatePresence>
        {selectedCenterData && (
          <CenterPopup
            center={selectedCenterData}
            weather={weather}
            loading={weatherLoading}
            onClose={() => onCenterSelect(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
