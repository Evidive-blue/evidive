"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";

export type CenterGlobePoint = {
  slug: string;
  lat: number;
  lng: number;
  label: string;
  regionLabel: string;
  description: string;
  color: string;
};

type GlobeComponentProps = GlobeProps & {
  ref?: MutableRefObject<GlobeMethods | undefined>;
};

const Globe = dynamic<GlobeComponentProps>(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-white/5">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
    </div>
  ),
});

const DEFAULT_EARTH_TEXTURE_URL =
  "https://unpkg.com/three-globe/example/img/earth-night.jpg";

export function CentersGlobe({
  locale,
  points,
}: {
  locale: string;
  points: CenterGlobePoint[];
}) {
  const t = useTranslations("centers");
  const router = useRouter();

  const pointsData = useMemo(() => points, [points]);

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [hoveredPoint, setHoveredPoint] = useState<CenterGlobePoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CenterGlobePoint | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;

    function updateSize() {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    }

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;

    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
  }, [size.width, size.height]);

  function focusPoint(point: CenterGlobePoint) {
    setSelectedPoint(point);
    globeRef.current?.pointOfView(
      { lat: point.lat, lng: point.lng, altitude: 1.65 },
      900
    );
  }

  function openCenter(point: CenterGlobePoint) {
    router.push(`/${locale}/center/${point.slug}`);
  }

  const renderWidth = Math.max(0, Math.floor(size.width));
  const renderHeight = Math.max(0, Math.floor(size.height));

  const earthTextureUrl =
    process.env.NEXT_PUBLIC_EARTH_TEXTURE_URL ?? DEFAULT_EARTH_TEXTURE_URL;

  return (
    <motion.div
      className="glass relative overflow-hidden rounded-3xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

      <div ref={containerRef} className="relative h-[420px] w-full sm:h-[520px] lg:h-[640px]">
        {renderWidth > 0 && renderHeight > 0 ? (
          <Globe
            ref={globeRef}
            width={renderWidth}
            height={renderHeight}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={earthTextureUrl}
            showAtmosphere
            atmosphereColor="#22d3ee"
            atmosphereAltitude={0.18}
            pointsData={pointsData}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointLabel="label"
            pointRadius={0.35}
            pointAltitude={0.08}
            pointsMerge={false}
            showPointerCursor
            onPointHover={(point) =>
              setHoveredPoint((point ?? null) as CenterGlobePoint | null)
            }
            onPointClick={(point) => focusPoint(point as CenterGlobePoint)}
            onPointRightClick={(point) => openCenter(point as CenterGlobePoint)}
          />
        ) : (
          <div className="h-full w-full rounded-3xl bg-white/5" />
        )}

        {/* Active center overlay */}
        {hoveredPoint ?? selectedPoint ? (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-md">
              <div className="text-sm text-cyan-300">
                {(hoveredPoint ?? selectedPoint)?.regionLabel}
              </div>
              <div className="mt-1 text-xl font-semibold text-white">
                {(hoveredPoint ?? selectedPoint)?.label}
              </div>
              <div className="mt-2 text-sm text-white/70">
                {(hoveredPoint ?? selectedPoint)?.description}
              </div>
              <div className="mt-3 text-xs text-white/40">
                {t("directory.globeHint")}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick actions */}
      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap justify-center gap-2">
          {pointsData.slice(0, 8).map((center) => (
            <button
              key={center.slug}
              type="button"
              onClick={() => focusPoint(center)}
              className={
                center.slug === selectedPoint?.slug
                  ? "rounded-full border border-white/15 bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-white/20"
                  : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
              }
            >
              {center.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

