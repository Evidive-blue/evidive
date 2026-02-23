"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicApi, type PublicCenter } from "@/lib/api";
import {
  CentersFilters,
  CenterCard,
  CenterDetailDialog,
  type Globe3DMarkerData,
  type MapMarkerData,
} from "@/components/centers";

const CentersGlobe3DDynamic = dynamic(
  () => import("@/components/centers").then((mod) => mod.CentersGlobe3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    ),
  }
);

export function CentersClient(): React.ReactNode {
  const t = useTranslations("centersPage");
  const tDir = useTranslations("centers.directory");
  const [centers, setCenters] = useState<PublicCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(
    null
  );

  useEffect(() => {
    publicApi
      .getCenters()
      .then(setCenters)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error")
      )
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(
    () =>
      [...new Set(centers.map((c) => c.country).filter(Boolean))] as string[],
    [centers]
  );

  const filteredCenters = useMemo(() => {
    let result = centers;
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const name = c.name.toLowerCase();
        const city = (c.city ?? "").toLowerCase();
        const country = (c.country ?? "").toLowerCase();
        return (
          name.includes(query) ||
          city.includes(query) ||
          country.includes(query)
        );
      });
    }
    if (selectedCountry !== null) {
      result = result.filter((c) => c.country === selectedCountry);
    }
    return result;
  }, [centers, searchQuery, selectedCountry]);

  // Markers for the 3D globe (all centers with coordinates)
  const globeMarkers: Globe3DMarkerData[] = useMemo(() => {
    const withCoords = centers.filter(
      (c) => c.latitude !== null && c.longitude !== null
    );
    return withCoords.map((c) => ({
      id: c.id,
      location: [
        typeof c.latitude === "string"
          ? parseFloat(c.latitude)
          : (c.latitude ?? 0),
        typeof c.longitude === "string"
          ? parseFloat(c.longitude)
          : (c.longitude ?? 0),
      ] as [number, number],
      name: c.name,
      city: c.city ?? "",
      country: c.country ?? "",
      slug: c.slug ?? c.id,
    }));
  }, [centers]);

  const handleGlobeMarkerClick = useCallback((marker: Globe3DMarkerData) => {
    const mapMarker: MapMarkerData = {
      id: marker.id,
      location: marker.location,
      name: marker.name,
      city: marker.city,
      country: marker.country,
      slug: marker.slug,
    };
    setSelectedMarker(mapMarker);
    setDialogOpen(true);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCountryChange = useCallback((country: string | null) => {
    setSelectedCountry(country);
  }, []);

  const pageHeader = (
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
        {t("heroTitle")}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-lg text-slate-300">
        {t("heroSubtitle")}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100svh-6rem)] flex-col pb-8">
        <div className="container-custom flex flex-1 flex-col items-center gap-8">
          {pageHeader}
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="mt-4 text-slate-400">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100svh-6rem)] flex-col pb-8">
        <div className="container-custom flex flex-1 flex-col items-center gap-8">
          {pageHeader}
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-6rem)] flex-col pb-8">
      <div className="container-custom flex flex-1 flex-col gap-8">
        {pageHeader}

        {/* 3D Globe */}
        <div className="mx-auto aspect-square w-full max-w-[min(85vw,340px)] sm:max-w-[min(80vw,400px)] md:max-w-[480px] lg:max-w-[540px] xl:max-w-[600px]">
          <CentersGlobe3DDynamic
            markers={globeMarkers}
            onMarkerClick={handleGlobeMarkerClick}
            className="h-full w-full"
          />
        </div>

        {/* Filters */}
        <CentersFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedCountry={selectedCountry}
          onCountryChange={handleCountryChange}
          countries={countries}
          totalCount={centers.length}
          filteredCount={filteredCenters.length}
        />

        {/* Cards grid */}
        {filteredCenters.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
            <MapPin className="mb-4 h-12 w-12 text-slate-500" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              {searchQuery.length > 0
                ? tDir("noSearchResults")
                : tDir("emptyTitle")}
            </h2>
            <p className="mb-8 max-w-md text-slate-400">
              {tDir("emptyDescription")}
            </p>
            <Link
              href="/onboard/center"
              className="inline-flex items-center rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-500"
            >
              {t("registerCta")}
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${searchQuery}-${selectedCountry ?? "all"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredCenters.map((c, i) => (
                <CenterCard key={c.id} center={c} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* For visitors / For centers + CTA */}
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/30 p-8 backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold text-cyan-200">
              {t("forVisitorsTitle")}
            </h2>
            <p className="text-slate-300">{t("heroSubtitle")}</p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/30 p-8 backdrop-blur">
            <h2 className="mb-4 text-xl font-semibold text-cyan-200">
              {t("forCentersTitle")}
            </h2>
            <p className="mb-6 text-slate-300">{t("heroSubtitle")}</p>
            <Link
              href="/onboard/center"
              className="inline-flex items-center rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-500"
            >
              {t("registerCta")}
            </Link>
          </div>
        </div>
      </div>

      {/* Center detail dialog (opens on globe marker click) */}
      <CenterDetailDialog
        marker={selectedMarker}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
