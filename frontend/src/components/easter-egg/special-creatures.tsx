"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEasterEgg } from "./easter-egg-provider";

/**
 * Special clickable creatures overlaid on the ocean background.
 * They spawn at random intervals and positions, swim/bob/glide,
 * and clicking triggers the easter egg discovery flow.
 *
 * Creature types and movement:
 * - golden_fish:    common,   swims across screen      (surface zone)
 * - pearl_oyster:   uncommon, bobs on seabed            (mid zone)
 * - treasure_chest: rare,     bobs on seabed            (deep zone)
 * - whytcard_fish:  rare,     swims across screen       (mid zone)
 * - night_whale:    night,    slow majestic glide       (wide zone)
 *
 * CSS classes: ee-creature, ee-swim-ltr/rtl, ee-bob-anim,
 *   ee-glide-ltr/rtl, ee-depth-*, ee-flip, ee-discovering
 */

// ─── Types ───

type MovementKind = "swim" | "bob" | "glide";
type Direction = "ltr" | "rtl";

interface Creature {
  id: string;
  slug: string;
  x: number;
  y: number;
  direction: Direction;
  movement: MovementKind;
  depthClass: string;
  expiresAt: number;
}

interface CreatureConfig {
  slug: string;
  intervalMs: number;
  durationMs: number;
  nightOnly: boolean;
  movement: MovementKind;
  depthClass: string;
  yMin: number;
  yMax: number;
}

interface SparkleEntry {
  x: number;
  y: number;
  key: number;
}

// ─── Configuration ───

const CREATURE_CONFIGS: CreatureConfig[] = [
  { slug: "golden_fish",    intervalMs: 30_000,  durationMs: 25_000, nightOnly: false, movement: "swim",  depthClass: "ee-depth-surface", yMin: 80,   yMax: 300  },
  { slug: "pearl_oyster",   intervalMs: 90_000,  durationMs: 20_000, nightOnly: false, movement: "bob",   depthClass: "ee-depth-mid",     yMin: 300,  yMax: 700  },
  { slug: "treasure_chest", intervalMs: 180_000, durationMs: 25_000, nightOnly: false, movement: "bob",   depthClass: "ee-depth-deep",    yMin: 800,  yMax: 1400 },
  { slug: "whytcard_fish",  intervalMs: 240_000, durationMs: 30_000, nightOnly: false, movement: "swim",  depthClass: "ee-depth-mid",     yMin: 400,  yMax: 900  },
  { slug: "night_whale",    intervalMs: 120_000, durationMs: 45_000, nightOnly: true,  movement: "glide", depthClass: "ee-depth-wide",    yMin: 300,  yMax: 1100 },
];

function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= 21 || h < 5;
}

let creatureIdCounter = 0;

function spawnCreature(config: CreatureConfig): Creature {
  creatureIdCounter += 1;
  return {
    id: `${config.slug}-${creatureIdCounter}`,
    slug: config.slug,
    x: 10 + Math.random() * 75,
    y: config.yMin + Math.random() * (config.yMax - config.yMin),
    direction: Math.random() > 0.5 ? "ltr" : "rtl",
    movement: config.movement,
    depthClass: config.depthClass,
    expiresAt: Date.now() + config.durationMs,
  };
}

function getAnimDuration(slug: string): string {
  const config = CREATURE_CONFIGS.find((c) => c.slug === slug);
  if (!config) {return "25s";}
  if (config.movement === "bob") {return "4s";}
  return `${config.durationMs / 1000}s`;
}

function buildClasses(creature: Creature): string {
  const parts = ["ee-creature", creature.depthClass];

  switch (creature.movement) {
    case "swim":
      parts.push(creature.direction === "ltr" ? "ee-swim-ltr" : "ee-swim-rtl");
      break;
    case "glide":
      parts.push(creature.direction === "ltr" ? "ee-glide-ltr" : "ee-glide-rtl");
      break;
    case "bob":
      parts.push("ee-bob-anim");
      break;
  }

  /* LTR fish/whale face right — flip the SVG horizontally */
  if (
    (creature.movement === "swim" || creature.movement === "glide") &&
    creature.direction === "ltr"
  ) {
    parts.push("ee-flip");
  }

  return parts.join(" ");
}

// ─── Component ───

export function SpecialCreatures(): React.ReactNode {
  const { discover, discoveries } = useEasterEgg();
  const t = useTranslations("easterEgg");
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [sparkles, setSparkles] = useState<SparkleEntry[]>([]);
  const layerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const sparkleIdRef = useRef(0);
  const targetSyRef = useRef(0);
  const currentSyRef = useRef(0);
  const isLerpingRef = useRef(false);

  const discoveredSlugs = new Set(discoveries.map((d) => d.slug));

  // ─── Smooth scroll interpolation (lerp) ───
  const lerpTick = useCallback((): void => {
    const el = layerRef.current;
    if (!el) {
      isLerpingRef.current = false;
      return;
    }

    const diff = targetSyRef.current - currentSyRef.current;

    if (Math.abs(diff) < 0.5) {
      currentSyRef.current = targetSyRef.current;
      el.style.setProperty("--sy", String(Math.round(currentSyRef.current)));
      isLerpingRef.current = false;
      return;
    }

    currentSyRef.current += diff * 0.14;
    el.style.setProperty(
      "--sy",
      String(Math.round(currentSyRef.current * 10) / 10),
    );
    rafRef.current = requestAnimationFrame(lerpTick);
  }, []);

  const startLerp = useCallback((): void => {
    if (!isLerpingRef.current) {
      isLerpingRef.current = true;
      rafRef.current = requestAnimationFrame(lerpTick);
    }
  }, [lerpTick]);

  useEffect(() => {
    const sy = window.scrollY;
    targetSyRef.current = sy;
    currentSyRef.current = sy;
    layerRef.current?.style.setProperty("--sy", String(Math.round(sy)));

    const onScroll = (): void => {
      targetSyRef.current = window.scrollY;
      startLerp();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [startLerp]);

  // ─── Spawn creatures on intervals ───
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    for (const config of CREATURE_CONFIGS) {
      const delay = Math.random() * config.intervalMs * 0.5;
      const timer = setTimeout(() => {
        if (config.nightOnly && !isNightTime()) {return;}
        setCreatures((prev) => [...prev, spawnCreature(config)]);

        const interval = setInterval(() => {
          if (config.nightOnly && !isNightTime()) {return;}
          setCreatures((prev) => [...prev, spawnCreature(config)]);
        }, config.intervalMs);
        intervals.push(interval);
      }, delay);
      timers.push(timer);
    }

    return () => {
      for (const tm of timers) {clearTimeout(tm);}
      for (const iv of intervals) {clearInterval(iv);}
    };
  }, []);

  // ─── Cleanup expired creatures ───
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCreatures((prev) => prev.filter((c) => c.expiresAt > Date.now()));
    }, 2000);
    return () => clearInterval(cleanup);
  }, []);

  // ─── Cleanup sparkles after animation ───
  useEffect(() => {
    if (sparkles.length === 0) {return;}
    const timer = setTimeout(() => setSparkles([]), 600);
    return () => clearTimeout(timer);
  }, [sparkles]);

  // ─── Click handler — sparkle + discover ───
  function handleClick(creature: Creature, event: React.MouseEvent): void {
    if (discoveredSlugs.has(creature.slug)) {return;}

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    sparkleIdRef.current += 1;
    setSparkles((prev) => [
      ...prev,
      {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        key: sparkleIdRef.current,
      },
    ]);

    setCreatures((prev) => prev.filter((c) => c.id !== creature.id));

    setTimeout(() => {
      discover(creature.slug);
    }, 400);
  }

  if (creatures.length === 0 && sparkles.length === 0) {return null;}

  return (
    <section
      ref={layerRef}
      className="ee-creature-layer fixed inset-0 z-[5] overflow-hidden pointer-events-none"
      style={{ "--sy": "0" } as React.CSSProperties}
      aria-label={t("sectionLabel")}
    >
      {creatures.map((creature) => (
        <button
          key={creature.id}
          type="button"
          onClick={(e) => handleClick(creature, e)}
          className={`${buildClasses(creature)} absolute cursor-pointer border-0 bg-transparent p-0 pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2`}
          style={
            {
              "--ee-y": `${creature.y}px`,
              "--ee-x": `${creature.x}%`,
              "--ee-dur": getAnimDuration(creature.slug),
            } as React.CSSProperties
          }
          aria-label={t("creatureLabel")}
        >
          <CreatureSvg slug={creature.slug} />
        </button>
      ))}

      {/* Discovery sparkle burst */}
      {sparkles.map((s) => (
        <div
          key={s.key}
          className="ee-sparkle fixed z-[6] pointer-events-none"
          style={
            {
              "--spark-x": `${s.x}px`,
              "--spark-y": `${s.y}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </section>
  );
}

// ─── SVG Dispatcher ───

function CreatureSvg({ slug }: { slug: string }): React.ReactNode {
  switch (slug) {
    case "golden_fish":
      return <GoldenFishSvg />;
    case "pearl_oyster":
      return <PearlOysterSvg />;
    case "treasure_chest":
      return <TreasureChestSvg />;
    case "whytcard_fish":
      return <WhytCardFishSvg />;
    case "night_whale":
      return <NightWhaleSvg />;
    default:
      return null;
  }
}

// ─── SVG Components ───

/** Golden Fish — shimmering gold, larger than normal fish */
function GoldenFishSvg(): React.ReactNode {
  return (
    <svg
      className="h-8 w-12 ee-golden-shimmer"
      viewBox="0 0 48 32"
      fill="none"
    >
      <path
        d="M6 16 C6 8 16 4 24 4 C34 4 40 8 40 16 C40 24 34 28 24 28 C16 28 6 24 6 16Z"
        fill="hsla(45, 95%, 55%, 0.85)"
      />
      <path d="M24 4 C26 1 30 1 32 4" fill="hsla(40, 90%, 48%, 0.6)" />
      <g transform="translate(40, 16)">
        <path
          d="M0 -3 L8 -8 L6 0 L8 8 L0 3Z"
          fill="hsla(45, 95%, 55%, 0.7)"
          className="animate-[fish-tail-wag_1s_ease-in-out_infinite]"
        />
      </g>
      <circle cx="12" cy="14" r="2.5" fill="hsla(0,0%,10%,0.7)" />
      <circle cx="11.5" cy="13.5" r="1" fill="hsla(0,0%,100%,0.9)" />
      <path
        d="M16 10 Q20 8 24 10 Q28 8 32 10"
        stroke="hsla(50,100%,70%,0.5)"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M14 14 Q20 12 26 14 Q30 12 34 14"
        stroke="hsla(50,100%,70%,0.4)"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M16 18 Q20 16 24 18 Q28 16 32 18"
        stroke="hsla(50,100%,70%,0.5)"
        strokeWidth="0.5"
        fill="none"
      />
    </svg>
  );
}

/** Pearl Oyster — shell with a glowing pearl */
function PearlOysterSvg(): React.ReactNode {
  return (
    <svg
      className="h-10 w-12 drop-shadow-[0_0_10px_hsla(0,0%,90%,0.5)]"
      viewBox="0 0 48 40"
      fill="none"
    >
      <path
        d="M4 22 C4 30 14 36 24 36 C34 36 44 30 44 22"
        fill="hsla(30, 20%, 35%, 0.7)"
      />
      <path
        d="M8 24 Q16 28 24 27 Q32 28 40 24"
        stroke="hsla(30, 15%, 45%, 0.4)"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M10 28 Q18 31 24 30 Q30 31 38 28"
        stroke="hsla(30, 15%, 45%, 0.3)"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M4 22 C4 12 14 4 24 4 C34 4 44 12 44 22"
        fill="hsla(25, 22%, 40%, 0.65)"
      />
      <path
        d="M8 20 Q16 12 24 10 Q32 12 40 20"
        stroke="hsla(25, 18%, 50%, 0.35)"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M12 18 Q18 12 24 11 Q30 12 36 18"
        stroke="hsla(25, 18%, 50%, 0.3)"
        strokeWidth="0.8"
        fill="none"
      />
      <circle
        cx="24"
        cy="22"
        r="5"
        fill="hsla(0, 0%, 92%, 0.9)"
        className="ee-pearl-glow"
      />
      <circle cx="22" cy="20" r="2" fill="hsla(0, 0%, 100%, 0.95)" />
      <circle cx="26" cy="24" r="1" fill="hsla(320, 30%, 85%, 0.6)" />
    </svg>
  );
}

/** Treasure Chest — ornate chest with golden glow */
function TreasureChestSvg(): React.ReactNode {
  return (
    <svg
      className="h-10 w-14 drop-shadow-[0_0_12px_hsla(45,100%,50%,0.5)]"
      viewBox="0 0 56 40"
      fill="none"
    >
      <rect
        x="6"
        y="18"
        width="44"
        height="20"
        rx="2"
        fill="hsla(25, 50%, 28%, 0.8)"
      />
      <path
        d="M6 24 L50 24"
        stroke="hsla(25, 40%, 22%, 0.4)"
        strokeWidth="0.8"
      />
      <path
        d="M6 30 L50 30"
        stroke="hsla(25, 40%, 22%, 0.4)"
        strokeWidth="0.8"
      />
      <path
        d="M6 18 C6 8 18 2 28 2 C38 2 50 8 50 18"
        fill="hsla(25, 45%, 32%, 0.8)"
      />
      <path
        d="M10 16 C12 10 20 6 28 6 C36 6 44 10 46 16"
        stroke="hsla(25, 35%, 40%, 0.4)"
        strokeWidth="0.8"
        fill="none"
      />
      <rect
        x="4"
        y="17"
        width="48"
        height="3"
        rx="1"
        fill="hsla(40, 60%, 42%, 0.7)"
      />
      <rect
        x="24"
        y="2"
        width="8"
        height="36"
        rx="1"
        fill="hsla(40, 60%, 42%, 0.3)"
      />
      <circle
        cx="28"
        cy="24"
        r="3"
        fill="hsla(45, 80%, 55%, 0.9)"
        className="ee-chest-glow"
      />
      <rect
        x="27"
        y="26"
        width="2"
        height="4"
        rx="1"
        fill="hsla(45, 70%, 45%, 0.8)"
      />
      <path
        d="M12 16 Q28 8 44 16"
        stroke="hsla(50, 100%, 65%, 0.6)"
        strokeWidth="2"
        fill="none"
        className="ee-chest-glow"
      />
    </svg>
  );
}

/** WhytCard Fish — branded fish in WhytCard colors (cyan/purple) */
function WhytCardFishSvg(): React.ReactNode {
  return (
    <svg
      className="h-8 w-14 drop-shadow-[0_0_10px_hsla(260,80%,65%,0.6)]"
      viewBox="0 0 56 32"
      fill="none"
    >
      <path
        d="M6 16 C6 8 16 4 28 4 C38 4 48 8 48 16 C48 24 38 28 28 28 C16 28 6 24 6 16Z"
        fill="hsla(260, 70%, 55%, 0.8)"
      />
      <path
        d="M6 16 C6 10 14 6 24 6 C32 6 38 8 40 12"
        fill="hsla(190, 80%, 50%, 0.5)"
      />
      <path d="M22 4 C24 0 30 0 32 4" fill="hsla(260, 65%, 50%, 0.6)" />
      <g transform="translate(48, 16)">
        <path
          d="M0 -3 L7 -7 L5 0 L7 7 L0 3Z"
          fill="hsla(190, 80%, 50%, 0.7)"
          className="animate-[fish-tail-wag_0.8s_ease-in-out_infinite]"
        />
      </g>
      <circle cx="14" cy="14" r="2.8" fill="hsla(0,0%,100%,0.9)" />
      <circle cx="14" cy="14" r="1.5" fill="hsla(260,70%,40%,0.9)" />
      <circle cx="13.5" cy="13.5" r="0.5" fill="hsla(0,0%,100%,0.95)" />
      <path
        d="M24 12 L26 18 L28 14 L30 18 L32 12"
        stroke="hsla(0,0%,100%,0.8)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="38"
        cy="10"
        r="1"
        fill="hsla(190, 100%, 80%, 0.9)"
        className="ee-whytcard-sparkle"
      />
    </svg>
  );
}

/** Night Whale — large, majestic, appears only at night */
function NightWhaleSvg(): React.ReactNode {
  return (
    <svg
      className="h-16 w-32 drop-shadow-[0_0_16px_hsla(220,60%,40%,0.4)]"
      viewBox="0 0 128 64"
      fill="none"
    >
      <path
        d="M10 32 C10 18 30 8 60 8 C85 8 100 14 108 22 C112 26 114 30 114 32 C114 34 112 38 108 42 C100 50 85 56 60 56 C30 56 10 46 10 32Z"
        fill="hsla(220, 35%, 28%, 0.65)"
      />
      <path
        d="M20 34 C25 44 40 50 60 50 C80 50 95 46 105 38"
        fill="hsla(220, 25%, 38%, 0.4)"
      />
      <path
        d="M10 32 C14 34 20 35 26 34"
        stroke="hsla(220, 25%, 40%, 0.3)"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="24" cy="28" r="3" fill="hsla(0,0%,10%,0.5)" />
      <circle
        cx="23"
        cy="27"
        r="1"
        fill="hsla(200,80%,75%,0.6)"
        className="ee-biolum"
      />
      <path d="M68 8 C70 2 76 2 78 8" fill="hsla(220, 35%, 24%, 0.6)" />
      <g transform="translate(114, 32)">
        <path
          d="M0 -2 C4 -6 8 -12 14 -16 C10 -8 6 -2 4 0 C6 2 10 8 14 16 C8 12 4 6 0 2Z"
          fill="hsla(220, 35%, 28%, 0.5)"
        />
      </g>
      <path
        d="M40 38 C36 46 44 50 46 42"
        fill="hsla(220, 30%, 32%, 0.4)"
      />
      <circle
        cx="40"
        cy="22"
        r="1.5"
        fill="hsla(200, 100%, 75%, 0.7)"
        className="ee-biolum [animation-delay:0s]"
      />
      <circle
        cx="55"
        cy="18"
        r="1"
        fill="hsla(200, 100%, 80%, 0.6)"
        className="ee-biolum [animation-delay:0.5s]"
      />
      <circle
        cx="70"
        cy="20"
        r="1.2"
        fill="hsla(190, 100%, 75%, 0.65)"
        className="ee-biolum [animation-delay:1.1s]"
      />
      <circle
        cx="85"
        cy="24"
        r="0.8"
        fill="hsla(200, 100%, 80%, 0.5)"
        className="ee-biolum [animation-delay:1.7s]"
      />
      <circle
        cx="95"
        cy="28"
        r="1"
        fill="hsla(195, 100%, 78%, 0.6)"
        className="ee-biolum [animation-delay:2.3s]"
      />
    </svg>
  );
}
