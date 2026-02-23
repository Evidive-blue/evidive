"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import createGlobe from "cobe";
import { Link } from "@/i18n/navigation";
import { Thermometer, MapPin, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export interface GlobeMarkerData {
  location: [number, number];
  size: number;
  name: string;
  city: string;
  country: string;
  slug: string;
  temp?: number | null;
}

interface CentersGlobeProps {
  markers: GlobeMarkerData[];
  className?: string;
}

interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  marker: GlobeMarkerData | null;
}

const TEMPERATURE_COLOR_STOPS: Array<{ temp: number; color: [number, number, number] }> = [
  { temp: -5, color: [0.7, 0.5, 1.0] },
  { temp: 5, color: [0.4, 0.7, 1.0] },
  { temp: 12, color: [0.2, 1.0, 0.9] },
  { temp: 18, color: [0.3, 1.0, 0.4] },
  { temp: 24, color: [1.0, 1.0, 0.2] },
  { temp: 29, color: [1.0, 0.7, 0.1] },
  { temp: 35, color: [1.0, 0.3, 0.2] },
];

const DEFAULT_MARKER_COLOR: [number, number, number] = [1.0, 1.0, 1.0];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function tempToGlobeColor(temp: number | null | undefined): [number, number, number] {
  if (temp === null || temp === undefined) {return DEFAULT_MARKER_COLOR;}
  const firstStop = TEMPERATURE_COLOR_STOPS[0];
  const lastStop = TEMPERATURE_COLOR_STOPS[TEMPERATURE_COLOR_STOPS.length - 1];
  if (!firstStop || !lastStop) {return DEFAULT_MARKER_COLOR;}
  if (temp <= firstStop.temp) {return firstStop.color;}
  if (temp >= lastStop.temp) {return lastStop.color;}
  for (let i = 0; i < TEMPERATURE_COLOR_STOPS.length - 1; i++) {
    const low = TEMPERATURE_COLOR_STOPS[i];
    const high = TEMPERATURE_COLOR_STOPS[i + 1];
    if (!low || !high || temp < low.temp || temp > high.temp) {continue;}
    const t0 = (temp - low.temp) / (high.temp - low.temp);
    return [
      lerp(low.color[0], high.color[0], t0),
      lerp(low.color[1], high.color[1], t0),
      lerp(low.color[2], high.color[2], t0),
    ];
  }
  return DEFAULT_MARKER_COLOR;
}

function projectMarkerToScreen(
  lat: number,
  lng: number,
  currentPhi: number,
  currentTheta: number,
  canvasWidth: number
): { x: number; y: number } | null {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const sx = Math.cos(latRad) * Math.sin(lngRad);
  const sy = -Math.sin(latRad);
  const sz = Math.cos(latRad) * Math.cos(lngRad);
  const cosTheta = Math.cos(currentTheta);
  const sinTheta = Math.sin(currentTheta);
  const rotAngle = currentPhi - Math.PI / 2;
  const cosRot = Math.cos(rotAngle);
  const sinRot = Math.sin(rotAngle);
  const x1 = sx * cosRot + sz * sinRot;
  const z1 = -sx * sinRot + sz * cosRot;
  const y1 = sy;
  const y2 = y1 * cosTheta - z1 * sinTheta;
  const z2 = y1 * sinTheta + z1 * cosTheta;
  if (z2 < -0.1) {return null;}
  const radius = canvasWidth / 2;
  return {
    x: radius + x1 * radius,
    y: radius - y2 * radius,
  };
}

const OCEAN_BASE_COLOR: [number, number, number] = [0.04, 0.12, 0.22];
const OCEAN_GLOW_COLOR: [number, number, number] = [0.03, 0.18, 0.35];
const MAP_DOT_SAMPLES = 16000;
const HOVER_DETECTION_RADIUS = 50;
const INITIAL_PHI = -0.3;
const INITIAL_THETA = 0.3;

export function CentersGlobe({ markers, className = "" }: CentersGlobeProps) {
  const t = useTranslations("centers.directory");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef(markers);
  const widthRef = useRef(0);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(INITIAL_PHI);
  const currentPhiRef = useRef(INITIAL_PHI);
  const currentThetaRef = useRef(INITIAL_THETA);
  const popupHoveredRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [popup, setPopup] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    marker: null,
  });

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  const findNearestMarker = useCallback((mouseX: number, mouseY: number): GlobeMarkerData | null => {
    const w = widthRef.current;
    if (w === 0) {return null;}
    let nearest: GlobeMarkerData | null = null;
    let nearestDist = HOVER_DETECTION_RADIUS;
    for (const marker of markersRef.current) {
      const projected = projectMarkerToScreen(
        marker.location[0],
        marker.location[1],
        currentPhiRef.current,
        currentThetaRef.current,
        w
      );
      if (!projected) {continue;}
      const dist = Math.hypot(projected.x - mouseX, projected.y - mouseY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = marker;
      }
    }
    return nearest;
  }, []);

  const getMarkerScreenPos = useCallback(
    (marker: GlobeMarkerData): { x: number; y: number } | null => {
      const w = widthRef.current;
      if (w === 0) {return null;}
      return projectMarkerToScreen(
        marker.location[0],
        marker.location[1],
        currentPhiRef.current,
        currentThetaRef.current,
        w
      );
    },
    []
  );

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) {clearTimeout(hideTimerRef.current);}
    hideTimerRef.current = setTimeout(() => {
      if (!popupHoveredRef.current) {
        setPopup((prev) => ({ ...prev, visible: false }));
      }
    }, 200);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
    if (canvasRef.current) {canvasRef.current.style.cursor = "grabbing";}
  }, []);

  const onPointerUp = useCallback(() => {
    pointerInteracting.current = null;
    if (canvasRef.current) {canvasRef.current.style.cursor = "grab";}
  }, []);

  const onPointerOut = useCallback(() => {
    pointerInteracting.current = null;
    if (canvasRef.current) {canvasRef.current.style.cursor = "grab";}
    scheduleHide();
  }, [scheduleHide]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (pointerInteracting.current !== null) {
        pointerInteractionMovement.current = e.clientX - pointerInteracting.current;
        setPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {return;}
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const nearest = findNearestMarker(mouseX, mouseY);
      if (nearest) {
        canvas.style.cursor = "pointer";
        cancelHide();
        const pos = getMarkerScreenPos(nearest);
        if (pos) {
          setPopup({ visible: true, x: pos.x, y: pos.y, marker: nearest });
        }
      } else {
        canvas.style.cursor = "grab";
        scheduleHide();
      }
    },
    [findNearestMarker, getMarkerScreenPos, cancelHide, scheduleHide]
  );

  useEffect(() => {
    if (!canvasRef.current) {return;}
    const canvas = canvasRef.current;
    let currentPhi = INITIAL_PHI;
    widthRef.current = canvas.offsetWidth;

    const onResize = () => {
      if (canvas) {widthRef.current = canvas.offsetWidth;}
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: INITIAL_PHI,
      theta: INITIAL_THETA,
      dark: 1,
      diffuse: 2.5,
      mapSamples: MAP_DOT_SAMPLES,
      mapBrightness: 6,
      mapBaseBrightness: 0.05,
      baseColor: OCEAN_BASE_COLOR,
      markerColor: DEFAULT_MARKER_COLOR,
      glowColor: OCEAN_GLOW_COLOR,
      opacity: 0.85,
      markers: markersRef.current.map((m) => ({
        location: m.location,
        size: m.size,
        color: tempToGlobeColor(m.temp),
      })),
      onRender: (state: Record<string, unknown>) => {
        const interactionOffset = pointerInteractionMovement.current / 200;
        currentPhi = phiRef.current + interactionOffset;
        currentPhiRef.current = currentPhi;
        currentThetaRef.current = INITIAL_THETA;
        state.phi = currentPhi;
        state.theta = INITIAL_THETA;
        state.width = widthRef.current * 2;
        state.height = widthRef.current * 2;
        state.markers = markersRef.current.map((m) => ({
          location: m.location,
          size: m.size,
          color: tempToGlobeColor(m.temp),
        }));
      },
    });

    setTimeout(() => {
      if (canvas) {canvas.classList.remove("opacity-0");}
    }, 100);

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square w-full mx-auto ${className}`}
    >
      <div className="absolute inset-0 scale-110 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerOut}
        onMouseMove={onMouseMove}
        className="w-full h-full cursor-grab opacity-0 transition-opacity duration-1000 [contain:layout_paint_size]"
      />
      {popup.visible && popup.marker && (
        <div
          className="absolute z-50 -translate-x-1/2 -translate-y-[130%] left-[var(--popup-x)] top-[var(--popup-y)]"
          style={{ '--popup-x': `${popup.x}px`, '--popup-y': `${popup.y}px` } as React.CSSProperties}
          onMouseEnter={() => {
            popupHoveredRef.current = true;
            cancelHide();
          }}
          onMouseLeave={() => {
            popupHoveredRef.current = false;
            scheduleHide();
          }}
        >
          <Link
            href={`/centers/${popup.marker.slug}`}
            className="block min-w-[200px] max-w-[260px] rounded-xl border border-white/20 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-lg transition-colors hover:border-cyan-500/40 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
          >
            <p className="truncate text-sm font-semibold text-white">
              {popup.marker.name}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-500/70" />
              <span className="truncate">
                {popup.marker.city}, {popup.marker.country}
              </span>
            </div>
            {popup.marker.temp !== null && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-300">
                <Thermometer className="h-3.5 w-3.5 shrink-0" />
                <span>{popup.marker.temp}°C</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-cyan-400">
              <span>{t("viewCenter")}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
