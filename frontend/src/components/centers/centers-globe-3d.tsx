"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ─── Types ───────────────────────────────────────────────

export interface Globe3DMarkerData {
  id: string;
  location: [number, number]; // [lat, lng]
  name: string;
  city: string;
  country: string;
  slug: string;
}

interface CentersGlobe3DProps {
  markers: Globe3DMarkerData[];
  className?: string;
  onMarkerClick?: (marker: Globe3DMarkerData) => void;
}

// ─── Constants ───────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const GLOBE_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";
const INITIAL_CENTER: [number, number] = [20, 15];
const INITIAL_ZOOM = 1.5;

// ─── Component ───────────────────────────────────────────

export function CentersGlobe3D({
  markers,
  className = "",
  onMarkerClick,
}: CentersGlobe3DProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMarkerClick = useCallback(
    (marker: Globe3DMarkerData) => {
      onMarkerClick?.(marker);
      mapRef.current?.flyTo({
        center: [marker.location[1], marker.location[0]],
        zoom: 4,
        duration: 1200,
        essential: true,
      });
    },
    [onMarkerClick]
  );

  useEffect(() => {
    if (!containerRef.current || MAPBOX_TOKEN.length === 0) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: GLOBE_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: INITIAL_ZOOM,
      projection: "globe",
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;

    map.on("style.load", () => {
      // Subtle atmosphere, no stars — globe floats on the page background
      map.setFog({
        color: "rgb(10, 18, 35)",
        "high-color": "rgb(12, 22, 45)",
        "horizon-blend": 0.06,
        "space-color": "rgb(8, 12, 24)",
        "star-intensity": 0,
      });

      setIsLoaded(true);
    });

    map.on("load", () => {
      // Add dive flag markers
      for (const markerData of markers) {
        const el = document.createElement("button");
        el.className = "globe-3d-marker";
        el.setAttribute("type", "button");
        el.setAttribute("aria-label", markerData.name);

        // Dive flag SVG inline for crisp rendering
        el.innerHTML = `<svg width="28" height="36" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.667 16 24 16 24s16-13.333 16-24C32 7.163 24.837 0 16 0z" fill="#1e293b" stroke="#0891b2" stroke-width="1.5"/>
          <rect x="8" y="6" width="16" height="16" rx="2" fill="#dc2626"/>
          <path d="M8 18.5L20.5 6H24L8 22V18.5z" fill="white"/>
        </svg>`;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          handleMarkerClick(markerData);
        });

        const mapboxMarker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([markerData.location[1], markerData.location[0]])
          .addTo(map);

        markersRef.current.push(mapboxMarker);
      }
    });

    // Slow auto-rotation
    let animationId: number;
    let rotationPaused = false;

    const spinGlobe = (): void => {
      if (!rotationPaused && map.isStyleLoaded()) {
        const center = map.getCenter();
        center.lng -= 0.02;
        map.setCenter(center);
      }
      animationId = requestAnimationFrame(spinGlobe);
    };

    map.on("mousedown", () => {
      rotationPaused = true;
    });
    map.on("mouseup", () => {
      setTimeout(() => {
        rotationPaused = false;
      }, 3000);
    });
    map.on("touchstart", () => {
      rotationPaused = true;
    });
    map.on("touchend", () => {
      setTimeout(() => {
        rotationPaused = false;
      }, 3000);
    });

    animationId = requestAnimationFrame(spinGlobe);

    return () => {
      cancelAnimationFrame(animationId);
      for (const m of markersRef.current) {
        m.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [markers, handleMarkerClick]);

  if (MAPBOX_TOKEN.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/50 ${className}`}
      >
        <p className="text-sm text-slate-500">
          Mapbox token required for 3D globe
        </p>
      </div>
    );
  }

  return (
    <div
      className={`globe-3d-wrapper relative overflow-hidden rounded-full ${className}`}
    >
      <div ref={containerRef} className="h-full w-full" />
      {/* Radial feather — fades the edges of the globe into the page background */}
      <div
        className="globe-3d-feather pointer-events-none absolute inset-0 rounded-full"
        aria-hidden="true"
      />
      {/* Fade overlay while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
