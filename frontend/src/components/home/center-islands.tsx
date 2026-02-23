"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

/** Minimal center data for the island display */
export interface IslandCenterData {
  id: string;
  displayName: string;
  city: string | null;
  slug: string | null;
  featured: boolean;
  verified: boolean;
}

interface CenterIslandsProps {
  centers: IslandCenterData[];
}

/* ═══════════════════════════════════════════════════
   SSR-safe client detection (zero re-render)
   ═══════════════════════════════════════════════════ */

const emptySubscribe = (): (() => void) => () => {};
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/* ═══════════════════════════════════════════════════
   Pre-defined island positions
   ═══════════════════════════════════════════════════ */

interface IslandSlot {
  left: number;
  offsetY: number;
  palmVariant: 0 | 1 | 2;
}

const ISLAND_SLOTS: readonly IslandSlot[] = [
  { left: 8, offsetY: 2, palmVariant: 0 },
  { left: 28, offsetY: -1, palmVariant: 1 },
  { left: 52, offsetY: 3, palmVariant: 2 },
  { left: 74, offsetY: -2, palmVariant: 1 },
  { left: 92, offsetY: 1, palmVariant: 0 },
];

/* ═══════════════════════════════════════════════════
   Main component — renders featured-center islands
   at the ocean waterline (~30vh).

   Uses position: fixed + scroll-driven translate
   (same zero-re-render pattern as ocean-background).
   ═══════════════════════════════════════════════════ */

export function CenterIslands({
  centers,
}: CenterIslandsProps): React.ReactNode {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const t = useTranslations("islandCenters");
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetIsyRef = useRef(0);
  const currentIsyRef = useRef(0);
  const isLerpingRef = useRef(false);

  const lerpTick = useCallback(() => {
    const el = layerRef.current;
    if (!el) {
      isLerpingRef.current = false;
      return;
    }

    const diff = targetIsyRef.current - currentIsyRef.current;

    if (Math.abs(diff) < 0.5) {
      currentIsyRef.current = targetIsyRef.current;
      el.style.setProperty("--isy", String(Math.round(currentIsyRef.current)));
      isLerpingRef.current = false;
      return;
    }

    currentIsyRef.current += diff * 0.14;
    el.style.setProperty(
      "--isy",
      String(Math.round(currentIsyRef.current * 10) / 10),
    );
    rafRef.current = requestAnimationFrame(lerpTick);
  }, []);

  const startLerp = useCallback(() => {
    if (!isLerpingRef.current) {
      isLerpingRef.current = true;
      rafRef.current = requestAnimationFrame(lerpTick);
    }
  }, [lerpTick]);

  const onScroll = useCallback(() => {
    targetIsyRef.current = window.scrollY;
    startLerp();
  }, [startLerp]);

  const updateScroll = useCallback(() => {
    const sy = window.scrollY;
    targetIsyRef.current = sy;
    currentIsyRef.current = sy;
    const el = layerRef.current;
    if (el) {
      el.style.setProperty("--isy", String(Math.round(sy)));
    }
  }, []);

  useEffect(() => {
    if (!isClient) {return;}
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isClient, onScroll, updateScroll]);

  if (!isClient || centers.length === 0) {return null;}

  const displayed = centers.slice(0, 5);

  return (
    <section
      ref={layerRef}
      className="island-layer fixed inset-x-0 top-[26vh] z-[5] h-[14vh] pointer-events-none"
      style={{ "--isy": "0" } as React.CSSProperties}
      aria-label={t("sectionLabel")}
    >
      {displayed.map((center, i) => {
        const slot = ISLAND_SLOTS[i];
        if (!slot) {return null;}

        // First 2 always visible, 3rd from sm, 4th-5th from lg
        const vis =
          i < 2 ? "" : i < 3 ? "hidden sm:block" : "hidden lg:block";

        return (
          <IslandCard
            key={center.id}
            center={center}
            slot={slot}
            animDelay={i * 0.4}
            visibilityClass={vis}
            featuredLabel={t("featured")}
            verifiedLabel={t("verified")}
            viewCenterLabel={t("viewCenter")}
          />
        );
      })}
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   Individual island with sign board
   ═══════════════════════════════════════════════════ */

function IslandCard({
  center,
  slot,
  animDelay,
  visibilityClass,
  featuredLabel,
  verifiedLabel,
  viewCenterLabel,
}: {
  center: IslandCenterData;
  slot: IslandSlot;
  animDelay: number;
  visibilityClass: string;
  featuredLabel: string;
  verifiedLabel: string;
  viewCenterLabel: string;
}): React.ReactNode {
  const href = `/centers/${center.slug ?? center.id}` as const;

  const badgeClass = center.featured
    ? "island-badge-featured"
    : center.verified
      ? "island-badge-verified"
      : "";

  const badgeText = center.featured
    ? featuredLabel
    : center.verified
      ? verifiedLabel
      : null;

  return (
    <div
      className={`island-card absolute bottom-0 pointer-events-auto ${visibilityClass}`}
      style={
        {
          "--island-left": `${slot.left}%`,
          "--island-offset-y": `${slot.offsetY}px`,
          "--island-anim-delay": `${animDelay}s`,
        } as React.CSSProperties
      }
    >
      {/* Wooden sign board — clickable link to center page */}
      <Link
        href={href}
        className="island-sign-link group block outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 rounded"
        aria-label={`${viewCenterLabel}: ${center.displayName}`}
      >
        <div className="island-sign">
          <span className="island-sign-name">{center.displayName}</span>
          {center.city ? (
            <span className="island-sign-city">{center.city}</span>
          ) : null}
          {badgeText ? (
            <span className={`island-badge ${badgeClass}`}>{badgeText}</span>
          ) : null}
        </div>
      </Link>

      {/* SVG island shape */}
      <IslandSvg variant={slot.palmVariant} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SVG island graphics — three palm variants
   ═══════════════════════════════════════════════════ */

function IslandSvg({ variant }: { variant: 0 | 1 | 2 }): React.ReactNode {
  return (
    <svg
      className="island-shape"
      viewBox="0 0 120 80"
      aria-hidden="true"
    >
      {/* Subtle water ring around base */}
      <ellipse
        cx="60"
        cy="64"
        rx="52"
        ry="10"
        fill="hsla(195, 80%, 60%, 0.12)"
      />

      {/* Sand mound */}
      <ellipse cx="60" cy="60" rx="45" ry="14" fill="hsl(40, 55%, 62%)" />
      {/* Sand highlight for depth */}
      <ellipse
        cx="55"
        cy="57"
        rx="28"
        ry="8"
        fill="hsl(42, 60%, 72%)"
        opacity="0.5"
      />

      {/* Vegetation variant */}
      {variant === 0 ? (
        <PalmSingle />
      ) : variant === 1 ? (
        <PalmWithBush />
      ) : (
        <PalmDouble />
      )}
    </svg>
  );
}

/** Single tall palm tree */
function PalmSingle(): React.ReactNode {
  return (
    <g className="island-palm">
      {/* Trunk */}
      <path
        d="M55 58 Q50 38 52 18"
        stroke="hsl(35, 55%, 35%)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <path
        d="M52 18 Q38 14 26 24"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 18 Q62 10 74 16"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 18 Q40 6 30 10"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 18 Q60 4 72 6"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M52 18 Q48 5 42 2"
        stroke="hsl(130, 40%, 45%)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Medium palm + small bush */
function PalmWithBush(): React.ReactNode {
  return (
    <g className="island-palm">
      {/* Trunk */}
      <path
        d="M58 58 Q55 40 56 22"
        stroke="hsl(35, 55%, 35%)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <path
        d="M56 22 Q44 18 34 26"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M56 22 Q64 14 76 18"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M56 22 Q50 10 42 8"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M56 22 Q62 8 70 6"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Small bush */}
      <ellipse cx="42" cy="54" rx="8" ry="6" fill="hsl(130, 40%, 35%)" />
      <ellipse cx="46" cy="52" rx="6" ry="5" fill="hsl(130, 48%, 40%)" />
    </g>
  );
}

/** Two small palms */
function PalmDouble(): React.ReactNode {
  return (
    <g className="island-palm">
      {/* Left palm */}
      <path
        d="M45 58 Q42 42 44 28"
        stroke="hsl(35, 55%, 35%)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 28 Q34 24 28 32"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 28 Q50 20 58 24"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M44 28 Q38 16 32 16"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right palm (shorter) */}
      <path
        d="M70 58 Q68 44 69 34"
        stroke="hsl(35, 55%, 35%)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M69 34 Q62 30 56 36"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M69 34 Q76 28 82 32"
        stroke="hsl(130, 45%, 35%)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M69 34 Q66 22 62 22"
        stroke="hsl(130, 50%, 40%)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}
