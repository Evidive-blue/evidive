"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Type declarations for Google Maps (loaded dynamically)
/* eslint-disable @typescript-eslint/no-explicit-any */
type GoogleMap = any;
type GoogleMarker = any;
type GoogleMapMouseEvent = any;
type GoogleGeocoder = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  labels: {
    latitude: string;
    longitude: string;
  };
  disabled?: boolean;
  className?: string;
}

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  labels,
  disabled,
  className,
}: LocationPickerProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<GoogleMap | null>(null);
  const [marker, setMarker] = React.useState<GoogleMarker | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Google Maps script
  React.useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key not configured");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof window !== "undefined" && !win.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setError("Failed to load Google Maps");
      document.head.appendChild(script);
    } else if (win.google) {
      setIsLoaded(true);
    }
  }, []);

  // Initialize map
  React.useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const initialLat = latitude || 43.7102;
    const initialLng = longitude || 7.262;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps) return;

    const newMap = new googleMaps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0e4a5f" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#1a1a2e" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#2a2a4a" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#1a1a2e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#000000" }, { weight: 2 }],
        },
      ],
    });

    const newMarker = new googleMaps.Marker({
      position: { lat: initialLat, lng: initialLng },
      map: newMap,
      draggable: !disabled,
      title: "Center location",
      animation: googleMaps.Animation.DROP,
    });

    // Update coordinates when marker is dragged
    newMarker.addListener("dragend", () => {
      const position = newMarker.getPosition();
      if (position) {
        onLocationChange(position.lat(), position.lng());
      }
    });

    // Update marker position when clicking on map
    if (!disabled) {
      newMap.addListener("click", (e: GoogleMapMouseEvent) => {
        if (e.latLng) {
          newMarker.setPosition(e.latLng);
          onLocationChange(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    setMap(newMap);
    setMarker(newMarker);
  }, [isLoaded, disabled, latitude, longitude, onLocationChange, map]);

  // Update marker position when coordinates change externally
  React.useEffect(() => {
    if (marker && map) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.setPosition(newPosition);
      map.panTo(newPosition);
    }
  }, [latitude, longitude, marker, map]);

  // Handle manual coordinate input
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLat = parseFloat(e.target.value) || 0;
    onLocationChange(newLat, longitude);
  };

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLng = parseFloat(e.target.value) || 0;
    onLocationChange(latitude, newLng);
  };

  // Geocode address to coordinates
  const geocodeAddress = React.useCallback(async (address: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleMaps = (window as any).google?.maps;
    if (!isLoaded || !googleMaps) return;

    const geocoder: GoogleGeocoder = new googleMaps.Geocoder();
    try {
      const result = await geocoder.geocode({ address });
      if (result.results[0]?.geometry?.location) {
        const location = result.results[0].geometry.location;
        onLocationChange(location.lat(), location.lng());
        if (map && marker) {
          map.panTo(location);
          map.setZoom(15);
          marker.setPosition(location);
        }
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  }, [isLoaded, map, marker, onLocationChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Coordinate Inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">{labels.latitude}</label>
          <Input
            type="number"
            step="any"
            value={latitude}
            onChange={handleLatChange}
            disabled={disabled}
            placeholder="43.7102"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90">{labels.longitude}</label>
          <Input
            type="number"
            step="any"
            value={longitude}
            onChange={handleLngChange}
            disabled={disabled}
            placeholder="7.2620"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-80 overflow-hidden rounded-xl border border-white/10">
        {error || !GOOGLE_MAPS_API_KEY ? (
          // Fallback view when Google Maps is not available
          <div className="flex h-full flex-col items-center justify-center bg-white/5">
            <svg
              className="h-16 w-16 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="mt-4 text-sm text-white/50">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm text-cyan-400 hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Voir sur Google Maps
            </a>
            {error && (
              <p className="mt-2 text-xs text-amber-400">{error}</p>
            )}
          </div>
        ) : !isLoaded ? (
          // Loading state
          <div className="flex h-full items-center justify-center bg-white/5">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : (
          // Google Maps container
          <div ref={mapRef} className="h-full w-full" />
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-white/50">
        {GOOGLE_MAPS_API_KEY 
          ? "Cliquez sur la carte ou glissez le marqueur pour définir l'emplacement de votre centre."
          : "Astuce: Trouvez vos coordonnées sur Google Maps en faisant un clic droit sur votre emplacement."
        }
      </p>
    </div>
  );
}
