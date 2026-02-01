"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";
import type { GlobeMethods, GlobeProps } from "react-globe.gl";
import { Sparkles } from "lucide-react";

type DestinationKey = "maldives" | "bali" | "redSea" | "greatBarrier";

type DestinationPoint = {
  id: DestinationKey;
  lat: number;
  lng: number;
  color: string;
  label: string;
  region: string;
  description: string;
};

type GlobeComponentProps = GlobeProps & {
  ref?: MutableRefObject<GlobeMethods | undefined>;
};

const Globe = dynamic<GlobeComponentProps>(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-white/5">
      <motion.div
        className="relative"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-16 w-16 rounded-full border-2 border-white/20 border-t-cyan-400" />
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </div>
  ),
});

const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe/example/img/earth-night.jpg";

export function WorldExplorerSection() {
  const t = useTranslations("worldExplorer");
  const tDestinations = useTranslations("destinations");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const pointsData = useMemo<DestinationPoint[]>(
    () => [
      {
        id: "maldives",
        lat: 3.2028,
        lng: 73.2207,
        color: "#22d3ee",
        label: tDestinations("maldives.name"),
        region: tDestinations("maldives.region"),
        description: tDestinations("maldives.description"),
      },
      {
        id: "bali",
        lat: -8.4095,
        lng: 115.1889,
        color: "#06b6d4",
        label: tDestinations("bali.name"),
        region: tDestinations("bali.region"),
        description: tDestinations("bali.description"),
      },
      {
        id: "redSea",
        lat: 27.1855,
        lng: 34.8693,
        color: "#0ea5e9",
        label: tDestinations("redSea.name"),
        region: tDestinations("redSea.region"),
        description: tDestinations("redSea.description"),
      },
      {
        id: "greatBarrier",
        lat: -18.2871,
        lng: 147.6992,
        color: "#0284c7",
        label: tDestinations("greatBarrier.name"),
        region: tDestinations("greatBarrier.region"),
        description: tDestinations("greatBarrier.description"),
      },
    ],
    [tDestinations]
  );

  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [hoveredPoint, setHoveredPoint] = useState<DestinationPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DestinationPoint | null>(null);

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
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;
  }, [size.width, size.height]);

  function focusPoint(point: DestinationPoint) {
    setSelectedPoint(point);
    globeRef.current?.pointOfView(
      { lat: point.lat, lng: point.lng, altitude: 1.65 },
      900
    );
  }

  const renderWidth = Math.max(0, Math.floor(size.width));
  const renderHeight = Math.max(0, Math.floor(size.height));

  return (
    <section ref={sectionRef} className="relative py-32">
      {/* Ambient background effects */}
      <motion.div
        className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
          >
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">
              Globe interactif
            </span>
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-white/60">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Globe */}
        <motion.div
          className="glass relative overflow-hidden rounded-3xl"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Ambient glow */}
          <motion.div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <div
            ref={containerRef}
            className="relative h-[420px] w-full sm:h-[520px] lg:h-[640px]"
          >
            {renderWidth > 0 && renderHeight > 0 ? (
              <Globe
                ref={globeRef}
                width={renderWidth}
                height={renderHeight}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl={EARTH_TEXTURE_URL}
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
                  setHoveredPoint((point ?? null) as DestinationPoint | null)
                }
                onPointClick={(point) => focusPoint(point as DestinationPoint)}
              />
            ) : (
              <div className="h-full w-full rounded-3xl bg-white/5" />
            )}

            {/* Active destination overlay */}
            {hoveredPoint ?? selectedPoint ? (
              <motion.div
                className="pointer-events-none absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-cyan-400"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-sm text-cyan-300">
                      {(hoveredPoint ?? selectedPoint)?.region}
                    </span>
                  </div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {(hoveredPoint ?? selectedPoint)?.label}
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    {(hoveredPoint ?? selectedPoint)?.description}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Destination quick actions */}
          <div className="border-t border-white/10 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-2">
              {pointsData.map((destination, index) => (
                <motion.button
                  key={destination.id}
                  type="button"
                  onClick={() => focusPoint(destination)}
                  className={
                    destination.id === selectedPoint?.id
                      ? "rounded-full border border-cyan-500/30 bg-cyan-500/20 px-4 py-2 text-sm text-white backdrop-blur-sm transition"
                      : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {destination.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
