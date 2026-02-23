"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import MapGL, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Link } from "@/i18n/navigation";
import { MapPin, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

// ─── Types ───────────────────────────────────────────────

export interface MapMarkerData {
  id: string;
  location: [number, number]; // [lat, lng]
  name: string;
  city: string;
  country: string;
  slug: string;
}

interface CentersMapProps {
  markers: MapMarkerData[];
  className?: string;
}

// ─── Colorful map tiles (free, no API key) ───────────────

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// ─── Initial viewport centered on Europe ─────────────────

const INITIAL_VIEW = {
  longitude: 20,
  latitude: 20,
  zoom: 1.8,
} as const;

// ─── Component ───────────────────────────────────────────

export function CentersMap({
  markers,
  className = "",
}: CentersMapProps): React.ReactNode {
  const t = useTranslations("centers.directory");
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState<{
    longitude: number;
    latitude: number;
    zoom: number;
  }>({
    longitude: INITIAL_VIEW.longitude,
    latitude: INITIAL_VIEW.latitude,
    zoom: INITIAL_VIEW.zoom,
  });

  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(
    null
  );

  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  }, []);

  const handleMarkerClick = useCallback(
    (marker: MapMarkerData) => {
      setSelectedMarker(marker);
      mapRef.current?.flyTo({
        center: [marker.location[1], marker.location[0]],
        zoom: Math.max(viewState.zoom, 5),
        duration: 800,
      });
    },
    [viewState.zoom]
  );

  const handleClosePopup = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const markerElements = useMemo(
    () =>
      markers.map((m) => (
        <Marker
          key={m.id}
          longitude={m.location[1]}
          latitude={m.location[0]}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            handleMarkerClick(m);
          }}
        >
          <button
            type="button"
            className="group relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-full"
            aria-label={m.name}
          >
            {/* Outer glow ring */}
            <span className="absolute h-6 w-6 rounded-full bg-cyan-600/30 group-hover:bg-cyan-500/40 transition-colors duration-200" />
            {/* Core dot */}
            <span className="relative h-3 w-3 rounded-full border-2 border-white bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.7)] group-hover:bg-cyan-500 group-hover:shadow-[0_0_12px_rgba(8,145,178,0.9)] transition-all duration-200" />
          </button>
        </Marker>
      )),
    [markers, handleMarkerClick]
  );

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-800 ${className}`}
    >
      <MapGL
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onClick={handleClosePopup}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        maxZoom={14}
        minZoom={1.2}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {markerElements}

        {selectedMarker && (
          <Popup
            longitude={selectedMarker.location[1]}
            latitude={selectedMarker.location[0]}
            anchor="bottom"
            closeOnClick={false}
            onClose={handleClosePopup}
            offset={14}
            className="centers-map-popup"
            maxWidth="260px"
          >
            <Link
              href={`/centers/${selectedMarker.slug}`}
              className="block rounded-lg bg-slate-900 px-3 py-2.5 text-left transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
            >
              <p className="truncate text-sm font-semibold text-white">
                {selectedMarker.name}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-500/70" />
                <span className="truncate">
                  {selectedMarker.city}, {selectedMarker.country}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs font-medium text-cyan-400">
                <span>{t("viewCenter")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </Popup>
        )}
      </MapGL>
    </div>
  );
}
