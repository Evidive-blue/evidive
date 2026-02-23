"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Fond ocean immersif — zero re-render.
 *
 * Structure visuelle (de haut en bas) :
 *   0 → 30vh  : ciel (gradient jour/nuit) + soleil
 *   ~30vh     : surface de l'eau (vagues animees)
 *   30vh → 100vh : ocean sous-marin (gradient profondeur)
 *
 * Le soleil suit l'heure reelle :
 *   - 6h  → gauche  (lever)
 *   - 12h → centre haut (zenith)
 *   - 18h → droite  (coucher)
 *   - nuit → invisible
 *
 * Couleurs dynamiques (ciel + eau) suivent l'heure reelle :
 *   - Aube (5h-8h)  : ciel orange-rose, eau turquoise chaude
 *   - Jour (8h-17h) : ciel bleu vif, eau bleu clair
 *   - Crepuscule (17h-20h) : ciel rose-violet, eau cuivree
 *   - Nuit (20h-5h) : ciel bleu fonce, eau bleu marine
 *
 * Perf : scroll → CSS custom properties via useRef (zero re-render).
 *        Soleil → CSS vars mise a jour toutes les 60s.
 *        GPU : will-change + translateZ(0) partout.
 */

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const MAX_HALOS = 6;

/* ═══════════════════════════════════════════════════
   Dynamic color palettes — interpolated by real time
   ═══════════════════════════════════════════════════ */

type HSL = [number, number, number]; // [hue, saturation%, lightness%]

interface ColorPalette {
  skyTop: HSL;
  skyMid: HSL;
  skyBot: HSL;
  seaTop: HSL;
  seaMid: HSL;
  seaBot: HSL;
}

const PALETTE_NIGHT: ColorPalette = {
  skyTop: [235, 35, 3], // near black
  skyMid: [230, 40, 7], // very dark blue
  skyBot: [225, 30, 16], // night sky above horizon — lighter, muted
  seaTop: [210, 60, 6], // dark saturated water — clearly darker than sky
  seaMid: [220, 65, 4], // deep ocean
  seaBot: [240, 90, 2], // abyss
};

const PALETTE_DAWN: ColorPalette = {
  skyTop: [250, 35, 18], // deep indigo
  skyMid: [20, 70, 45], // warm peach/orange
  skyBot: [30, 85, 58], // golden horizon
  seaTop: [185, 55, 28], // cool turquoise water — distinct from warm sky
  seaMid: [210, 60, 16], // dark teal
  seaBot: [230, 80, 5], // abyss
};

const PALETTE_DAY: ColorPalette = {
  skyTop: [210, 80, 20], // deep blue
  skyMid: [205, 70, 40], // vivid sky blue
  skyBot: [195, 80, 60], // bright horizon — lighter
  seaTop: [195, 55, 30], // ocean surface — noticeably darker
  seaMid: [215, 70, 15], // deep blue
  seaBot: [235, 85, 4], // abyss
};

const PALETTE_DUSK: ColorPalette = {
  skyTop: [270, 40, 18], // deep purple
  skyMid: [340, 55, 38], // rose
  skyBot: [15, 78, 52], // warm orange horizon
  seaTop: [200, 50, 18], // cool dark water — distinct from warm sky
  seaMid: [225, 58, 12], // deep purple-blue
  seaBot: [240, 85, 3], // abyss
};

/** Timeline keypoints — hour → palette */
const COLOR_TIMELINE: Array<{ hour: number; palette: ColorPalette }> = [
  { hour: 0, palette: PALETTE_NIGHT },
  { hour: 5, palette: PALETTE_NIGHT },
  { hour: 6.5, palette: PALETTE_DAWN },
  { hour: 8.5, palette: PALETTE_DAY },
  { hour: 16, palette: PALETTE_DAY },
  { hour: 18, palette: PALETTE_DUSK },
  { hour: 20, palette: PALETTE_NIGHT },
  { hour: 24, palette: PALETTE_NIGHT },
];

function lerpHSL(a: HSL, b: HSL, t: number): HSL {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function lerpPalette(
  a: ColorPalette,
  b: ColorPalette,
  t: number
): ColorPalette {
  return {
    skyTop: lerpHSL(a.skyTop, b.skyTop, t),
    skyMid: lerpHSL(a.skyMid, b.skyMid, t),
    skyBot: lerpHSL(a.skyBot, b.skyBot, t),
    seaTop: lerpHSL(a.seaTop, b.seaTop, t),
    seaMid: lerpHSL(a.seaMid, b.seaMid, t),
    seaBot: lerpHSL(a.seaBot, b.seaBot, t),
  };
}

function hslStr(c: HSL): string {
  return `hsl(${Math.round(c[0])}, ${Math.round(c[1])}%, ${Math.round(c[2])}%)`;
}

function getPaletteForHour(hour: number): ColorPalette {
  for (let i = 0; i < COLOR_TIMELINE.length - 1; i++) {
    const cur = COLOR_TIMELINE[i];
    const next = COLOR_TIMELINE[i + 1];
    if (!cur || !next) {
      continue;
    }
    if (hour >= cur.hour && hour <= next.hour) {
      const span = next.hour - cur.hour;
      const t = span === 0 ? 0 : (hour - cur.hour) / span;
      return lerpPalette(cur.palette, next.palette, t);
    }
  }
  return PALETTE_NIGHT;
}

export function OceanBackground() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // ─── Smooth scroll interpolation (lerp) ───
  // Instead of snapping --sy to window.scrollY each frame, we interpolate
  // toward the target over multiple frames. This gives a fluid parallax
  // feel without changing the native scroll behavior.
  const targetSyRef = useRef(0);
  const currentSyRef = useRef(0);
  const isLerpingRef = useRef(false);

  const lerpTick = useCallback(() => {
    const el = rootRef.current;
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

  const startLerp = useCallback(() => {
    if (!isLerpingRef.current) {
      isLerpingRef.current = true;
      rafRef.current = requestAnimationFrame(lerpTick);
    }
  }, [lerpTick]);

  const onScroll = useCallback(() => {
    targetSyRef.current = window.scrollY;
    startLerp();
  }, [startLerp]);

  const updateProgress = useCallback(() => {
    const sy = window.scrollY;
    targetSyRef.current = sy;
    currentSyRef.current = sy;
    const el = rootRef.current;
    if (el) {
      el.style.setProperty("--sy", String(Math.round(sy)));
    }
  }, []);

  // ─── Sun & Moon position + dynamic colors from real time ───
  const updateSunMoon = useCallback(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }

    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;

    // ─── Sun (day 6h-18h) ───
    const t = Math.max(0, Math.min(1, (h - 6) / 12));
    const x = 8 + t * 84;
    const norm = t * 2 - 1;
    const y = 12 + 73 * norm * norm;

    let sunVis: number;
    if (h < 6) {
      sunVis = 0;
    } else if (h < 7) {
      sunVis = h - 6;
    } else if (h <= 17) {
      sunVis = 1;
    } else if (h < 18) {
      sunVis = 18 - h;
    } else {
      sunVis = 0;
    }

    const warmth = 1 - Math.abs(norm);

    el.style.setProperty("--sun-x", `${x}%`);
    el.style.setProperty("--sun-y", `${y}%`);
    el.style.setProperty(
      "--sun-vis",
      Math.max(0, Math.min(1, sunVis)).toString()
    );
    el.style.setProperty("--sun-warmth", warmth.toString());

    // ─── Moon (night 18h-6h) — arc inverse du soleil ───
    const tMoon = h >= 18 ? (h - 18) / 12 : (h + 6) / 12;
    const xMoon = 8 + tMoon * 84;
    const normMoon = tMoon * 2 - 1;
    const yMoon = 12 + 73 * normMoon * normMoon;

    let moonVis: number;
    if (h < 5) {
      moonVis = 1;
    } else if (h < 6) {
      moonVis = 6 - h;
    } else if (h < 18) {
      moonVis = 0;
    } else if (h < 19) {
      moonVis = h - 18;
    } else {
      moonVis = 1;
    }

    el.style.setProperty("--moon-x", `${xMoon}%`);
    el.style.setProperty("--moon-y", `${yMoon}%`);
    el.style.setProperty(
      "--moon-vis",
      Math.max(0, Math.min(1, moonVis)).toString()
    );

    // ─── Dynamic sky & water colors ───
    const palette = getPaletteForHour(h);
    el.style.setProperty("--sky-top", hslStr(palette.skyTop));
    el.style.setProperty("--sky-mid", hslStr(palette.skyMid));
    el.style.setProperty("--sky-bot", hslStr(palette.skyBot));
    el.style.setProperty("--sea-top", hslStr(palette.seaTop));
    el.style.setProperty("--sea-mid", hslStr(palette.seaMid));
    el.style.setProperty("--sea-bot", hslStr(palette.seaBot));
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    updateSunMoon();
    const sunMoonInterval = setInterval(updateSunMoon, 60_000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
      clearInterval(sunMoonInterval);
    };
  }, [isMounted, onScroll, updateProgress, updateSunMoon]);

  // ─── Click → halo bubble ───
  // Decorative halo effect on pointer interaction (aria-hidden element, not a functional button)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }

      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const halo = document.createElement("div");
      halo.className = "ocean-halo";
      halo.style.setProperty("--halo-x", `${x}px`);
      halo.style.setProperty("--halo-y", `${y}px`);

      root.appendChild(halo);

      const onEnd = () => {
        halo.removeEventListener("animationend", onEnd);
        halo.remove();
      };
      halo.addEventListener("animationend", onEnd);

      const halos = root.querySelectorAll(".ocean-halo");
      if (halos.length > MAX_HALOS && halos[0]) {
        halos[0].remove();
      }
    },
    []
  );

  return (
    <div
      ref={rootRef}
      className="ocean-root fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
      style={
        {
          "--sy": "0",
          "--sun-x": "50%",
          "--sun-y": "50%",
          "--sun-vis": "0",
          "--sun-warmth": "1",
          "--moon-x": "50%",
          "--moon-y": "50%",
          "--moon-vis": "0",
          "--sky-top": hslStr(PALETTE_NIGHT.skyTop),
          "--sky-mid": hslStr(PALETTE_NIGHT.skyMid),
          "--sky-bot": hslStr(PALETTE_NIGHT.skyBot),
          "--sea-top": hslStr(PALETTE_NIGHT.seaTop),
          "--sea-mid": hslStr(PALETTE_NIGHT.seaMid),
          "--sea-bot": hslStr(PALETTE_NIGHT.seaBot),
        } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
    >
      {/* Full-screen ocean gradient (stays fixed, darkens with depth) */}
      <div className="ocean-gradient absolute inset-0" />

      {/* Underwater depth haze (stays fixed to viewport) */}
      <div className="ocean-depth-haze absolute inset-0 pointer-events-none" />

      {/* ═══ Single scroll-translated layer ═══
          One transform instead of ~25 — major compositor win.
          Everything that scrolls goes inside this wrapper. */}
      <div className="ocean-scroll-layer absolute inset-0">

      {/* ─── Sky area (0 → 32vh) ─── */}
      <div className="ocean-sky absolute inset-x-0 top-0 h-[32vh]">
        <div className="ocean-sky-bg absolute inset-0" />
        {/* Sun rays (starburst beams from sun) */}
        <div className="ocean-sun-rays" />
        {/* Sun glow (larger, behind core) */}
        <div className="ocean-sun-glow" />
        {/* Sun inner glow (brighter center halo) */}
        <div className="ocean-sun-inner-glow" />
        {/* Sun core (small bright circle) */}
        <div className="ocean-sun-core" />
        {/* Moon glow (night) */}
        <div className="ocean-moon-glow" />
        {/* Moon core (night) */}
        <div className="ocean-moon-core" />
      </div>

      {/* ─── Seabirds in the sky ─── */}
      <div className="ocean-birds-wrap absolute inset-x-0 top-0 h-[30vh] pointer-events-none overflow-hidden">
        {/* Flock 1 — 3 gulls drifting left to right */}
        <div className="ocean-bird-flock bird-fly-ltr [animation-duration:28s] [animation-delay:0s] absolute top-[22%]">
          <svg className="ocean-bird w-6 h-3" viewBox="0 0 24 12" fill="none">
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.55)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <svg
            className="ocean-bird w-5 h-2.5 absolute left-8 top-1 [animation-delay:0.3s]"
            viewBox="0 0 24 12"
            fill="none"
          >
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.45)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <svg
            className="ocean-bird w-4 h-2 absolute left-4 -top-1 [animation-delay:0.6s]"
            viewBox="0 0 24 12"
            fill="none"
          >
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.4)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        {/* Flock 2 — 2 gulls right to left, higher */}
        <div className="ocean-bird-flock bird-fly-rtl [animation-duration:32s] [animation-delay:8s] absolute top-[12%]">
          <svg className="ocean-bird w-5 h-2.5" viewBox="0 0 24 12" fill="none">
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.5)"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <svg
            className="ocean-bird w-4 h-2 absolute left-6 top-0.5 [animation-delay:0.4s]"
            viewBox="0 0 24 12"
            fill="none"
          >
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.38)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        {/* Flock 3 — single distant gull */}
        <div className="ocean-bird-flock bird-fly-ltr [animation-duration:40s] [animation-delay:18s] absolute top-[35%]">
          <svg className="ocean-bird w-3 h-1.5" viewBox="0 0 24 12" fill="none">
            <path
              d="M0 6 Q6 0 12 5 Q18 0 24 6"
              stroke="hsla(0,0%,100%,0.3)"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─── Leaping dolphin near surface ─── */}
      <div className="ocean-leaping-wrap absolute inset-x-0 top-[calc(30vh-40px)] h-[80px] pointer-events-none">
        <div className="ocean-leaping-dolphin dolphin-leap [animation-duration:18s] [animation-delay:6s]">
          <svg className="w-12 h-7 -scale-x-100" viewBox="0 0 48 28" fill="none">
            <path
              d="M4 18 C6 12 14 6 24 6 C34 6 40 10 44 16"
              fill="hsla(210, 30%, 50%, 0.6)"
            />
            <path
              d="M4 18 C6 22 14 26 24 26 C34 26 40 22 44 18"
              fill="hsla(210, 20%, 62%, 0.45)"
            />
            <path d="M28 6 C30 2 34 2 36 6" fill="hsla(210, 30%, 45%, 0.5)" />
            <path
              d="M16 20 C14 24 18 26 20 22"
              fill="hsla(210, 28%, 50%, 0.4)"
            />
            <g transform="translate(44, 17)">
              <path
                d="M0 -2 C2 -4 4 -7 5 -9 C4 -4 2 -1 1 0 C2 1 4 4 5 9 C4 7 2 4 0 2Z"
                fill="hsla(210, 30%, 48%, 0.5)"
              />
            </g>
            <circle cx="10" cy="15" r="1.2" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="9.7" cy="14.7" r="0.4" fill="hsla(0,0%,100%,0.5)" />
            <path
              d="M4 19 C5 20 7 20 8 19"
              stroke="hsla(210,25%,45%,0.3)"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* Sun reflection column on water surface */}
      <div className="ocean-sun-reflect absolute inset-x-0 top-[30vh] h-[25vh]" />

      {/* Sun ray reflections on water (shimmer streaks) */}
      <div className="ocean-sun-water-rays absolute inset-x-0 top-[30vh] h-[18vh]" />

      {/* Moon reflection on water surface */}
      <div className="ocean-moon-reflect absolute inset-x-0 top-[30vh] h-[20vh]" />

      {/* ─── Underwater god rays from the sun ─── */}
      <div className="ocean-sun-godrays absolute inset-x-0 top-[30vh] bottom-0 overflow-hidden pointer-events-none">
        <div className="ocean-godray godray-1" />
        <div className="ocean-godray godray-2" />
        <div className="ocean-godray godray-3" />
        <div className="ocean-godray godray-4" />
        <div className="ocean-godray godray-5" />
        <div className="ocean-godray godray-6" />
        <div className="ocean-godray godray-7" />
        <div className="ocean-godray godray-8" />
      </div>

      {/* ─── Water surface — waves at ~30vh ─── */}
      <div className="ocean-surface absolute inset-x-0 top-[30vh] h-20">
        {/* Light edge at waterline */}
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-sky-200/40 to-transparent" />

        {/* ─── Surface foam (white organic blobs) ─── */}
        <svg
          className="ocean-foam-1 absolute -left-[5%] -top-1 w-[110%] h-8"
          viewBox="0 0 1200 32"
          preserveAspectRatio="none"
          fill="none"
        >
          <ellipse
            cx="120"
            cy="16"
            rx="60"
            ry="8"
            fill="hsla(0, 0%, 100%, 0.12)"
          />
          <ellipse
            cx="350"
            cy="14"
            rx="45"
            ry="6"
            fill="hsla(0, 0%, 100%, 0.10)"
          />
          <ellipse
            cx="580"
            cy="18"
            rx="70"
            ry="9"
            fill="hsla(0, 0%, 100%, 0.14)"
          />
          <ellipse
            cx="800"
            cy="15"
            rx="50"
            ry="7"
            fill="hsla(0, 0%, 100%, 0.11)"
          />
          <ellipse
            cx="1050"
            cy="17"
            rx="55"
            ry="8"
            fill="hsla(0, 0%, 100%, 0.13)"
          />
        </svg>
        <svg
          className="ocean-foam-2 absolute -left-[8%] top-1 w-[116%] h-6"
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          fill="none"
        >
          <ellipse
            cx="80"
            cy="12"
            rx="40"
            ry="6"
            fill="hsla(0, 0%, 100%, 0.08)"
          />
          <ellipse
            cx="280"
            cy="10"
            rx="55"
            ry="5"
            fill="hsla(0, 0%, 100%, 0.10)"
          />
          <ellipse
            cx="500"
            cy="14"
            rx="65"
            ry="7"
            fill="hsla(0, 0%, 100%, 0.09)"
          />
          <ellipse
            cx="720"
            cy="11"
            rx="48"
            ry="6"
            fill="hsla(0, 0%, 100%, 0.11)"
          />
          <ellipse
            cx="950"
            cy="13"
            rx="58"
            ry="7"
            fill="hsla(0, 0%, 100%, 0.08)"
          />
          <ellipse
            cx="1150"
            cy="12"
            rx="35"
            ry="5"
            fill="hsla(0, 0%, 100%, 0.10)"
          />
        </svg>

        {/* Wave layer 1 — front */}
        <svg
          className="ocean-wave-1 absolute -left-[10%] top-1 w-[120%]"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,20 C150,35 350,5 500,20 C650,35 850,5 1000,20 C1050,25 1150,15 1200,20 L1200,0 L0,0 Z"
            fill="hsla(195, 70%, 75%, 0.3)"
          />
        </svg>

        {/* Wave layer 2 — mid */}
        <svg
          className="ocean-wave-2 absolute -left-[10%] top-2 w-[120%]"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,20 C200,8 400,32 600,20 C800,8 1000,32 1200,20 L1200,0 L0,0 Z"
            fill="hsla(195, 60%, 65%, 0.25)"
          />
        </svg>

        {/* Wave layer 3 — back (slower) */}
        <svg
          className="ocean-wave-3 absolute -left-[10%] top-0 w-[120%]"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M0,22 C100,12 300,30 500,18 C700,6 900,28 1200,22 L1200,0 L0,0 Z"
            fill="hsla(200, 50%, 85%, 0.2)"
          />
        </svg>

        {/* Shimmer line at the water surface */}
        <div className="absolute inset-x-0 top-3 h-px bg-white/30 ocean-shimmer" />
      </div>

      {/* ─── Underwater caustic light refraction ─── */}
      <div className="ocean-caustics-wrap absolute inset-x-0 top-[30vh] bottom-0 pointer-events-none">
        <div className="caustic-overlay absolute inset-0" />
        <div className="caustic-overlay-alt absolute inset-0" />
        <div className="caustic-overlay-deep absolute inset-0" />
      </div>

      {/* ─── Marine dust (tiny floating organic debris) ─── */}
      <div className="ocean-dust-wrap absolute inset-x-0 top-[32vh] bottom-0 pointer-events-none">
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "12%",
              "--d-top": "15%",
              "--d-size": "2px",
              "--d-anim": "dust-float",
              "--d-dur": "11s",
              "--d-delay": "0s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "28%",
              "--d-top": "35%",
              "--d-size": "3px",
              "--d-anim": "dust-float-alt",
              "--d-dur": "14s",
              "--d-delay": "2s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "45%",
              "--d-top": "20%",
              "--d-size": "2px",
              "--d-anim": "dust-float",
              "--d-dur": "12s",
              "--d-delay": "4s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "62%",
              "--d-top": "50%",
              "--d-size": "3px",
              "--d-anim": "dust-float-alt",
              "--d-dur": "16s",
              "--d-delay": "1s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "78%",
              "--d-top": "30%",
              "--d-size": "2px",
              "--d-anim": "dust-float",
              "--d-dur": "13s",
              "--d-delay": "6s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "88%",
              "--d-top": "65%",
              "--d-size": "2px",
              "--d-anim": "dust-float-alt",
              "--d-dur": "15s",
              "--d-delay": "3s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "5%",
              "--d-top": "55%",
              "--d-size": "3px",
              "--d-anim": "dust-float",
              "--d-dur": "10s",
              "--d-delay": "5s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "35%",
              "--d-top": "75%",
              "--d-size": "2px",
              "--d-anim": "dust-float-alt",
              "--d-dur": "17s",
              "--d-delay": "7s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "55%",
              "--d-top": "85%",
              "--d-size": "3px",
              "--d-anim": "dust-float",
              "--d-dur": "12s",
              "--d-delay": "8s",
            } as React.CSSProperties
          }
        />
        <div
          className="dust-particle"
          style={
            {
              "--d-left": "72%",
              "--d-top": "10%",
              "--d-size": "2px",
              "--d-anim": "dust-float-alt",
              "--d-dur": "14s",
              "--d-delay": "9s",
            } as React.CSSProperties
          }
        />
      </div>

      {/* ─── Underwater effects ─── */}
      {/* Light rays from the surface */}
      <div className="ocean-rays-wrap ocean-rays absolute inset-0" />

      {/* Water movement texture (subtle) */}
      <div className="ocean-water-movement absolute inset-0" />

      {/* ─── Bubbles rising to the surface (reduced) ─── */}
      <div className="ocean-bubbles-wrap absolute inset-x-0 top-[32vh] bottom-0 pointer-events-none">
        <div className="ocean-bubble bubble-rise-1 left-[15%] [animation-delay:0s]" />
        <div className="ocean-bubble bubble-rise-2 left-[35%] [animation-delay:2.5s]" />
        <div className="ocean-bubble bubble-rise-3 left-[55%] [animation-delay:1s]" />
        <div className="ocean-bubble bubble-rise-1 left-[75%] [animation-delay:4s]" />
        <div className="ocean-bubble bubble-rise-2 bubble-lg left-[50%] [animation-delay:6s]" />
      </div>

      {/* ─── Suspended particles (underwater debris — reduced) ─── */}
      <div className="ocean-particles-wrap absolute inset-x-0 top-[32vh] bottom-0 pointer-events-none">
        <div className="ocean-particle particle-drift-1 left-[12%] top-[20%] [animation-delay:0s]" />
        <div className="ocean-particle particle-drift-2 left-[35%] top-[45%] [animation-delay:2s]" />
        <div className="ocean-particle particle-drift-3 left-[55%] top-[30%] [animation-delay:4s]" />
        <div className="ocean-particle particle-drift-1 left-[72%] top-[60%] [animation-delay:1s]" />
        <div className="ocean-particle particle-drift-2 left-[88%] top-[15%] [animation-delay:3.5s]" />
        <div className="ocean-particle particle-drift-3 left-[45%] top-[75%] [animation-delay:5s]" />
      </div>

      {/* ─── Fish: Surface zone (0-400px from waterline) ─── */}
      <div className="ocean-fish-surface absolute inset-0 pointer-events-none">
        {/* Banc 1 : poissons-chirurgiens bleus — formes variees */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:22s] [animation-delay:0s] top-[calc(30vh+80px)]">
          {/* Chirurgien 1 — corps haut, trait lateral jaune */}
          <svg
            className="ocean-fish-svg w-7 h-4"
            viewBox="0 0 28 16"
            fill="none"
          >
            <path
              d="M4 8 C4 4 8 2 14 2 C20 2 24 5 24 8 C24 11 20 14 14 14 C8 14 4 12 4 8Z"
              fill="hsla(215, 60%, 55%, 0.55)"
            />
            <path
              d="M8 8 L20 8"
              stroke="hsla(50, 90%, 65%, 0.45)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path d="M14 2 C15 0 17 0 18 2" fill="hsla(215, 55%, 48%, 0.4)" />
            <path
              d="M14 14 C15 16 17 16 18 14"
              fill="hsla(215, 55%, 48%, 0.4)"
            />
            <g transform="translate(24, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L4 -4 L3 0 L4 4 L0 1Z"
                  fill="hsla(50, 85%, 60%, 0.5)"
                />
              </g>
            </g>
            <circle cx="7" cy="7.5" r="0.8" fill="hsla(0,0%,100%,0.7)" />
          </svg>
          {/* Chirurgien 2 — plus petit, decale */}
          <svg
            className="ocean-fish-svg w-5 h-3 absolute left-7 top-1 [animation-delay:0.4s]"
            viewBox="0 0 28 16"
            fill="none"
          >
            <path
              d="M4 8 C4 4 8 2 14 2 C20 2 24 5 24 8 C24 11 20 14 14 14 C8 14 4 12 4 8Z"
              fill="hsla(210, 55%, 60%, 0.5)"
            />
            <path
              d="M8 8 L20 8"
              stroke="hsla(50, 85%, 60%, 0.4)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <g transform="translate(24, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L4 -4 L3 0 L4 4 L0 1Z"
                  fill="hsla(50, 80%, 58%, 0.45)"
                />
              </g>
            </g>
            <circle cx="7" cy="7.5" r="0.7" fill="hsla(0,0%,100%,0.6)" />
          </svg>
          {/* Chirurgien 3 — variation de teinte */}
          <svg
            className="ocean-fish-svg w-6 h-3.5 absolute left-14 -top-0.5 [animation-delay:0.8s]"
            viewBox="0 0 28 16"
            fill="none"
          >
            <path
              d="M4 8 C4 4 8 2 14 2 C20 2 24 5 24 8 C24 11 20 14 14 14 C8 14 4 12 4 8Z"
              fill="hsla(220, 58%, 52%, 0.55)"
            />
            <path
              d="M8 8 L20 8"
              stroke="hsla(48, 88%, 62%, 0.45)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <path d="M14 2 C15 0 17 0 18 2" fill="hsla(220, 52%, 45%, 0.4)" />
            <g transform="translate(24, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L4 -4 L3 0 L4 4 L0 1Z"
                  fill="hsla(48, 82%, 58%, 0.5)"
                />
              </g>
            </g>
            <circle cx="7" cy="7.5" r="0.7" fill="hsla(0,0%,100%,0.65)" />
          </svg>
          {/* Chirurgien 4 — plus petit */}
          <svg
            className="ocean-fish-svg w-4 h-2.5 absolute left-20 top-1.5 [animation-delay:1.1s]"
            viewBox="0 0 28 16"
            fill="none"
          >
            <path
              d="M4 8 C4 4 8 2 14 2 C20 2 24 5 24 8 C24 11 20 14 14 14 C8 14 4 12 4 8Z"
              fill="hsla(208, 52%, 58%, 0.5)"
            />
            <path
              d="M8 8 L20 8"
              stroke="hsla(50, 80%, 60%, 0.35)"
              strokeWidth="0.8"
            />
            <g transform="translate(24, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L4 -4 L3 0 L4 4 L0 1Z"
                  fill="hsla(50, 78%, 56%, 0.4)"
                />
              </g>
            </g>
          </svg>
        </div>
        {/* Banc 2 : poissons-demoiselles — plus ronds, turquoise/vert */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:24s] [animation-delay:3s] top-[calc(30vh+200px)]">
          <svg
            className="ocean-fish-svg w-5 h-4"
            viewBox="0 0 20 16"
            fill="none"
          >
            <ellipse
              cx="10"
              cy="8"
              rx="7"
              ry="6"
              fill="hsla(170, 55%, 50%, 0.55)"
            />
            <path d="M10 2 C11 0 12 0 13 2" fill="hsla(170, 50%, 42%, 0.4)" />
            <g transform="translate(17, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(170, 50%, 50%, 0.5)"
                />
              </g>
            </g>
            <circle cx="7" cy="7" r="0.8" fill="hsla(0,0%,100%,0.7)" />
          </svg>
          <svg
            className="ocean-fish-svg w-4 h-3 absolute right-5 -top-0.5 [animation-delay:0.3s]"
            viewBox="0 0 20 16"
            fill="none"
          >
            <ellipse
              cx="10"
              cy="8"
              rx="7"
              ry="6"
              fill="hsla(165, 50%, 52%, 0.5)"
            />
            <g transform="translate(17, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(165, 48%, 50%, 0.45)"
                />
              </g>
            </g>
            <circle cx="7" cy="7" r="0.7" fill="hsla(0,0%,100%,0.6)" />
          </svg>
          <svg
            className="ocean-fish-svg w-5 h-3.5 absolute right-10 top-1 [animation-delay:0.7s]"
            viewBox="0 0 20 16"
            fill="none"
          >
            <ellipse
              cx="10"
              cy="8"
              rx="7"
              ry="6"
              fill="hsla(175, 58%, 48%, 0.55)"
            />
            <path d="M10 2 C11 0 12 0 13 2" fill="hsla(175, 52%, 40%, 0.4)" />
            <g transform="translate(17, 8)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(175, 52%, 48%, 0.5)"
                />
              </g>
            </g>
            <circle cx="7" cy="7" r="0.7" fill="hsla(0,0%,100%,0.6)" />
          </svg>
        </div>
        {/* Requin-baleine — filtre-feeder, surface 200-400px, tres lent */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl-wide [animation-duration:70s] [animation-delay:20s] top-[calc(30vh+280px)]">
          <svg
            className="ocean-fish-svg w-[110px] h-12"
            viewBox="0 0 110 48"
            fill="none"
          >
            <path
              d="M8 24 C10 16 25 10 50 10 C70 10 88 14 96 20 L96 24"
              fill="hsla(215, 30%, 32%, 0.6)"
            />
            <path
              d="M8 24 C10 32 25 38 50 38 C70 38 88 34 96 28 L96 24"
              fill="hsla(215, 25%, 42%, 0.45)"
            />
            <path
              d="M8 24 C6 22 4 23 4 24 C4 25 6 26 8 24"
              fill="hsla(215, 28%, 30%, 0.55)"
            />
            <path d="M44 10 L47 2 L52 10" fill="hsla(215, 28%, 28%, 0.55)" />
            <path d="M70 12 L72 7 L76 12" fill="hsla(215, 28%, 28%, 0.4)" />
            <path
              d="M30 28 C24 36 20 42 18 44 C20 40 24 34 30 28"
              fill="hsla(215, 28%, 35%, 0.45)"
            />
            <g transform="translate(96, 24)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C4 -4 8 -10 12 -16 C10 -8 6 -2 4 0 C6 2 10 8 12 16 C8 10 4 4 0 2Z"
                  fill="hsla(215, 30%, 32%, 0.5)"
                />
              </g>
            </g>
            <path
              d="M18 16 C18 20 18 28 18 32"
              stroke="hsla(215, 20%, 40%, 0.25)"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M21 15 C21 20 21 28 21 33"
              stroke="hsla(215, 20%, 40%, 0.25)"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M24 14 C24 20 24 28 24 34"
              stroke="hsla(215, 20%, 40%, 0.25)"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Spotted pattern */}
            <circle cx="34" cy="16" r="1" fill="hsla(0,0%,100%,0.18)" />
            <circle cx="40" cy="14" r="0.8" fill="hsla(0,0%,100%,0.15)" />
            <circle cx="46" cy="17" r="1.1" fill="hsla(0,0%,100%,0.18)" />
            <circle cx="52" cy="14" r="0.7" fill="hsla(0,0%,100%,0.14)" />
            <circle cx="58" cy="16" r="1" fill="hsla(0,0%,100%,0.16)" />
            <circle cx="64" cy="13" r="0.8" fill="hsla(0,0%,100%,0.15)" />
            <circle cx="70" cy="15" r="0.9" fill="hsla(0,0%,100%,0.17)" />
            <circle cx="36" cy="22" r="0.7" fill="hsla(0,0%,100%,0.12)" />
            <circle cx="44" cy="24" r="0.9" fill="hsla(0,0%,100%,0.14)" />
            <circle cx="54" cy="22" r="0.8" fill="hsla(0,0%,100%,0.13)" />
            <circle cx="62" cy="25" r="0.7" fill="hsla(0,0%,100%,0.12)" />
            <circle cx="76" cy="17" r="0.8" fill="hsla(0,0%,100%,0.14)" />
            <circle cx="82" cy="15" r="0.7" fill="hsla(0,0%,100%,0.12)" />
            <circle cx="38" cy="30" r="0.8" fill="hsla(0,0%,100%,0.11)" />
            <circle cx="48" cy="32" r="0.7" fill="hsla(0,0%,100%,0.10)" />
            <circle cx="58" cy="30" r="0.9" fill="hsla(0,0%,100%,0.12)" />
            <circle cx="68" cy="32" r="0.7" fill="hsla(0,0%,100%,0.10)" />
            <circle cx="78" cy="28" r="0.8" fill="hsla(0,0%,100%,0.11)" />
            <circle cx="12" cy="22" r="1.5" fill="hsla(0,0%,10%,0.5)" />
            <circle cx="11.5" cy="21.5" r="0.5" fill="hsla(0,0%,100%,0.35)" />
            <path
              d="M4 24 C6 25 8 25 10 24"
              stroke="hsla(215, 20%, 30%, 0.3)"
              strokeWidth="0.8"
              fill="none"
            />
          </svg>
        </div>
        {/* Banc 3 : poissons-papillons — jaune/blanc, rayure noire */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:18s] [animation-delay:7s] top-[calc(30vh+350px)]">
          <svg
            className="ocean-fish-svg w-6 h-5"
            viewBox="0 0 24 20"
            fill="none"
          >
            <path
              d="M4 10 C4 5 8 2 12 2 C16 2 20 5 20 10 C20 15 16 18 12 18 C8 18 4 15 4 10Z"
              fill="hsla(48, 85%, 62%, 0.55)"
            />
            <path
              d="M14 3 C14 3 15 10 14 17"
              stroke="hsla(0,0%,10%,0.35)"
              strokeWidth="1.5"
              fill="none"
            />
            <path d="M12 2 C13 0 14 0 15 2" fill="hsla(48, 80%, 58%, 0.5)" />
            <g transform="translate(20, 10)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(48, 80%, 58%, 0.5)"
                />
              </g>
            </g>
            <circle cx="7" cy="9" r="1" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="6.7" cy="8.7" r="0.35" fill="hsla(0,0%,100%,0.8)" />
          </svg>
          <svg
            className="ocean-fish-svg w-5 h-4 absolute left-6 -top-0.5 [animation-delay:0.4s]"
            viewBox="0 0 24 20"
            fill="none"
          >
            <path
              d="M4 10 C4 5 8 2 12 2 C16 2 20 5 20 10 C20 15 16 18 12 18 C8 18 4 15 4 10Z"
              fill="hsla(45, 82%, 65%, 0.5)"
            />
            <path
              d="M14 3 C14 3 15 10 14 17"
              stroke="hsla(0,0%,10%,0.3)"
              strokeWidth="1.2"
              fill="none"
            />
            <g transform="translate(20, 10)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(45, 78%, 60%, 0.45)"
                />
              </g>
            </g>
            <circle cx="7" cy="9" r="0.8" fill="hsla(0,0%,10%,0.5)" />
          </svg>
          <svg
            className="ocean-fish-svg w-4 h-3.5 absolute left-11 top-1 [animation-delay:0.8s]"
            viewBox="0 0 24 20"
            fill="none"
          >
            <path
              d="M4 10 C4 5 8 2 12 2 C16 2 20 5 20 10 C20 15 16 18 12 18 C8 18 4 15 4 10Z"
              fill="hsla(50, 80%, 60%, 0.55)"
            />
            <path
              d="M14 3 C14 3 15 10 14 17"
              stroke="hsla(0,0%,10%,0.3)"
              strokeWidth="1"
              fill="none"
            />
            <g transform="translate(20, 10)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L3 -3 L2.5 0 L3 3 L0 1Z"
                  fill="hsla(50, 76%, 58%, 0.45)"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* ─── Fish: Shallow zone (400-900px) ─── */}
      <div className="ocean-fish-mid absolute inset-0 pointer-events-none">
        {/* Poisson-clown — top: calc(30vh + 500px) */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:28s] top-[calc(30vh+500px)]">
          <svg
            className="ocean-fish-svg w-12 h-7"
            viewBox="0 0 48 28"
            fill="none"
          >
            {/* Corps arrondi orange */}
            <path
              d="M6 14 C6 7 14 3 24 3 C34 3 42 7 42 14 C42 21 34 25 24 25 C14 25 6 21 6 14Z"
              fill="hsla(25, 90%, 55%, 0.65)"
            />
            {/* Bandes blanches */}
            <path
              d="M14 4 C14 4 13 14 14 24"
              stroke="hsla(0,0%,100%,0.75)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M28 3 C28 3 27 14 28 25"
              stroke="hsla(0,0%,100%,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Nageoire dorsale */}
            <path
              d="M18 4 C20 0 26 0 28 4"
              fill="hsla(25, 90%, 55%, 0.5)"
              stroke="hsla(0,0%,0%,0.15)"
              strokeWidth="0.5"
            />
            {/* Queue */}
            <g transform="translate(41, 14)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C4 -6 6 -6 7 -4 L2 0 L7 4 C6 6 4 6 0 2Z"
                  fill="hsla(25, 90%, 55%, 0.6)"
                />
              </g>
            </g>
            {/* Oeil */}
            <circle cx="11" cy="12" r="2.2" fill="hsla(0,0%,10%,0.8)" />
            <circle cx="10.5" cy="11.5" r="0.8" fill="hsla(0,0%,100%,0.9)" />
            {/* Nageoire pectorale */}
            <path
              d="M18 16 C20 20 24 19 22 16"
              fill="hsla(25, 85%, 50%, 0.4)"
            />
          </svg>
        </div>
        {/* Meduse 1 — top: calc(30vh + 600px) */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl jellyfish-float [animation-duration:30s] top-[calc(30vh+600px)]">
          <svg
            className="ocean-fish-svg w-9 h-12"
            viewBox="0 0 36 48"
            fill="none"
          >
            {/* Ombrelle translucide */}
            <path
              d="M4 16 C4 6 10 1 18 1 C26 1 32 6 32 16 C28 18 24 19 18 19 C12 19 8 18 4 16Z"
              fill="hsla(300, 45%, 65%, 0.35)"
            />
            <path
              d="M8 14 C8 8 12 4 18 4 C24 4 28 8 28 14"
              fill="hsla(300, 50%, 72%, 0.2)"
            />
            {/* Bord ondulé de l'ombrelle */}
            <path
              d="M4 16 C7 18 10 17 13 18 C16 19 18 19 21 18 C24 17 27 18 32 16"
              stroke="hsla(300, 40%, 70%, 0.5)"
              strokeWidth="1"
              fill="none"
            />
            {/* Tentacules fluides */}
            <path
              d="M8 18 C6 26 10 32 8 40"
              stroke="hsla(300, 40%, 70%, 0.35)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M13 19 C11 28 14 34 12 44"
              stroke="hsla(300, 40%, 70%, 0.3)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M18 19 C17 30 19 36 18 46"
              stroke="hsla(300, 40%, 70%, 0.35)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M23 19 C25 28 22 34 24 44"
              stroke="hsla(300, 40%, 70%, 0.3)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M28 18 C30 26 26 32 28 40"
              stroke="hsla(300, 40%, 70%, 0.35)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Organes internes */}
            <ellipse
              cx="18"
              cy="10"
              rx="4"
              ry="3"
              fill="hsla(310, 50%, 60%, 0.25)"
            />
          </svg>
        </div>
        {/* Raie manta — top: calc(30vh + 800px) */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:32s] [animation-delay:2s] top-[calc(30vh+800px)]">
          <svg
            className="ocean-fish-svg w-14 h-8"
            viewBox="0 0 56 32"
            fill="none"
          >
            {/* Ailes */}
            <path
              d="M28 16 C20 6 8 2 2 8 C4 12 12 14 28 16 C12 18 4 20 2 24 C8 30 20 26 28 16Z"
              fill="hsla(220, 25%, 40%, 0.5)"
            />
            <path
              d="M28 16 C36 6 48 2 54 8 C52 12 44 14 28 16 C44 18 52 20 54 24 C48 30 36 26 28 16Z"
              fill="hsla(220, 25%, 40%, 0.5)"
            />
            {/* Ventre clair */}
            <ellipse
              cx="28"
              cy="16"
              rx="8"
              ry="5"
              fill="hsla(220, 20%, 60%, 0.3)"
            />
            {/* Nageoires cephaliques */}
            <path
              d="M22 12 C20 8 18 6 16 7"
              stroke="hsla(220, 25%, 40%, 0.4)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M34 12 C36 8 38 6 40 7"
              stroke="hsla(220, 25%, 40%, 0.4)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Queue fine */}
            <g transform="translate(28, 16)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 0 C-2 0 -4 0 -8 0"
                  stroke="hsla(220, 20%, 35%, 0.4)"
                  strokeWidth="1"
                  fill="none"
                />
              </g>
            </g>
            {/* Yeux */}
            <circle cx="23" cy="14" r="1" fill="hsla(0,0%,10%,0.5)" />
            <circle cx="33" cy="14" r="1" fill="hsla(0,0%,10%,0.5)" />
            {/* Branchies */}
            <path
              d="M24 18 C25 20 27 20 28 18"
              stroke="hsla(220,20%,50%,0.25)"
              strokeWidth="0.5"
              fill="none"
            />
            <path
              d="M28 18 C29 20 31 20 32 18"
              stroke="hsla(220,20%,50%,0.25)"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>
        {/* Meduse 2 — top: calc(30vh + 750px) */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr jellyfish-float [animation-duration:26s] [animation-delay:4s] top-[calc(30vh+750px)]">
          <svg
            className="ocean-fish-svg w-10 h-11"
            viewBox="0 0 40 44"
            fill="hsla(330, 50%, 70%, 0.4)"
          >
            <ellipse cx="20" cy="11" rx="12" ry="9" />
            <path
              d="M8 20 Q12 38 20 42 Q28 38 32 20"
              stroke="hsla(330, 45%, 75%, 0.35)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M14 20 Q16 32 20 38"
              stroke="hsla(330, 45%, 75%, 0.3)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M26 20 Q24 32 20 38"
              stroke="hsla(330, 45%, 75%, 0.3)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─── Fish: Deep zone (1600-2500px) ─── */}
      <div className="ocean-fish-deep absolute inset-0 pointer-events-none">
        {/* Requin — top: calc(30vh + 1800px) */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:42s] top-[calc(30vh+1800px)]">
          <svg
            className="ocean-fish-svg w-[90px] h-10"
            viewBox="0 0 90 40"
            fill="none"
          >
            {/* Corps fusele - dos sombre */}
            <path
              d="M5 20 C8 16 20 10 40 12 C55 12 68 15 72 18 L72 20"
              fill="hsla(220, 20%, 25%, 0.65)"
            />
            {/* Ventre clair */}
            <path
              d="M5 20 C8 24 20 30 40 28 C55 28 68 25 72 22 L72 20"
              fill="hsla(220, 15%, 40%, 0.45)"
            />
            {/* Nageoire dorsale */}
            <path d="M38 12 L42 2 L48 12" fill="hsla(220, 20%, 22%, 0.6)" />
            {/* Nageoire pectorale */}
            <path d="M30 22 L22 30 L34 26" fill="hsla(220, 18%, 28%, 0.5)" />
            {/* Nageoire anale */}
            <path d="M56 26 L54 30 L60 26" fill="hsla(220, 18%, 28%, 0.4)" />
            {/* Queue en croissant */}
            <g transform="translate(72, 20)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C4 -4 8 -8 12 -12 C10 -6 8 -2 6 0 C8 2 10 6 12 12 C8 8 4 4 0 2Z"
                  fill="hsla(220, 20%, 25%, 0.6)"
                />
              </g>
            </g>
            {/* Branchies */}
            <path
              d="M24 16 C24 18 24 22 24 24"
              stroke="hsla(220, 15%, 35%, 0.3)"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M26 15 C26 18 26 23 26 25"
              stroke="hsla(220, 15%, 35%, 0.3)"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Oeil */}
            <circle cx="14" cy="18" r="1.8" fill="hsla(0,0%,5%,0.7)" />
            <circle cx="13.5" cy="17.5" r="0.5" fill="hsla(0,0%,100%,0.4)" />
            {/* Museau */}
            <path d="M5 20 C4 19 3 20 5 20" fill="hsla(220, 20%, 25%, 0.6)" />
          </svg>
        </div>
        {/* Anglerfish — top: calc(30vh + 2200px) */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:38s] [animation-delay:8s] top-[calc(30vh+2200px)]">
          <svg
            className="ocean-fish-svg w-[50px] h-8 anglerfish"
            viewBox="0 0 50 32"
            fill="none"
          >
            {/* Corps globuleux */}
            <path
              d="M10 16 C10 8 18 4 28 6 C36 6 42 10 42 16 C42 22 36 28 26 28 C16 28 10 24 10 16Z"
              fill="hsla(240, 30%, 12%, 0.7)"
            />
            {/* Machoire ouverte avec dents */}
            <path
              d="M10 16 C6 14 4 15 4 17 C4 19 6 20 10 18"
              fill="hsla(240, 25%, 8%, 0.6)"
            />
            <path
              d="M6 15.5 L7 16.5 M8 15 L8.5 16 M5 17 L6.5 17 M7 18 L7.5 17"
              stroke="hsla(0,0%,80%,0.5)"
              strokeWidth="0.6"
            />
            {/* Antenne bioluminescente */}
            <path
              d="M30 6 C30 2 34 -1 38 0 C40 0 42 2 42 4"
              stroke="hsla(240, 20%, 20%, 0.5)"
              strokeWidth="1"
              fill="none"
            />
            <circle
              cx="42"
              cy="3"
              r="3.5"
              className="angler-lure"
              fill="hsla(55, 95%, 75%, 0.9)"
            />
            <circle cx="42" cy="3" r="1.5" fill="hsla(50, 100%, 95%, 0.95)" />
            {/* Oeil surdimensionne */}
            <circle cx="18" cy="14" r="3.5" fill="hsla(180, 20%, 15%, 0.8)" />
            <circle cx="17" cy="13" r="1.5" fill="hsla(55, 80%, 70%, 0.6)" />
            {/* Nageoires */}
            <path
              d="M32 24 C34 28 38 28 36 24"
              fill="hsla(240, 25%, 15%, 0.4)"
            />
            <path d="M24 8 C26 6 30 7 28 10" fill="hsla(240, 25%, 15%, 0.3)" />
          </svg>
        </div>
        {/* Meduse geante — top: calc(30vh + 2600px) */}
        <div className="ocean-fish-bank absolute left-[30%] fish-swim-ltr jellyfish-float [animation-duration:35s] [animation-delay:3s] top-[calc(30vh+2600px)]">
          <svg
            className="ocean-fish-svg w-15 h-16"
            viewBox="0 0 60 64"
            fill="hsla(340, 55%, 45%, 0.35)"
          >
            <ellipse cx="30" cy="16" rx="22" ry="14" />
            <path
              d="M10 30 Q18 55 30 60 Q42 55 50 30"
              stroke="hsla(340, 50%, 50%, 0.3)"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M20 30 Q24 48 30 56"
              stroke="hsla(340, 50%, 50%, 0.25)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M40 30 Q36 48 30 56"
              stroke="hsla(340, 50%, 50%, 0.25)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
        {/* Baleine — zone profonde, tres lente */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr-wide [animation-duration:65s] [animation-delay:15s] top-[calc(30vh+1600px)]">
          <svg
            className="ocean-fish-svg w-[120px] h-14"
            viewBox="0 0 120 56"
            fill="none"
          >
            {/* Corps massif — dos bleu sombre */}
            <path
              d="M8 28 C10 18 22 10 45 8 C65 6 85 10 95 18 C100 22 102 25 104 28"
              fill="hsla(215, 35%, 28%, 0.55)"
            />
            {/* Ventre clair avec sillons */}
            <path
              d="M8 28 C10 38 22 46 45 48 C65 50 85 46 95 38 C100 34 102 31 104 28"
              fill="hsla(215, 25%, 42%, 0.4)"
            />
            <path
              d="M20 34 L60 36"
              stroke="hsla(215, 20%, 48%, 0.2)"
              strokeWidth="0.5"
            />
            <path
              d="M22 38 L58 40"
              stroke="hsla(215, 20%, 48%, 0.15)"
              strokeWidth="0.5"
            />
            <path
              d="M24 42 L56 43"
              stroke="hsla(215, 20%, 48%, 0.12)"
              strokeWidth="0.5"
            />
            {/* Nageoire pectorale */}
            <path
              d="M35 32 C30 40 26 46 22 48 C24 44 28 38 35 32"
              fill="hsla(215, 30%, 35%, 0.4)"
              className="ocean-whale-flipper"
            />
            {/* Nageoire dorsale (petite) */}
            <path d="M72 10 C74 8 76 8 78 10" fill="hsla(215, 32%, 26%, 0.4)" />
            {/* Queue — caudale massive */}
            <g transform="translate(104, 28)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C4 -6 8 -12 14 -18 C12 -10 8 -4 6 0 C8 4 12 10 14 18 C8 12 4 6 0 2Z"
                  fill="hsla(215, 35%, 28%, 0.5)"
                />
              </g>
            </g>
            {/* Oeil */}
            <circle cx="16" cy="26" r="2.5" fill="hsla(0,0%,8%,0.5)" />
            <circle cx="15.5" cy="25.5" r="0.8" fill="hsla(0,0%,100%,0.35)" />
            {/* Bouche */}
            <path
              d="M8 28 C6 28 4 29 6 30"
              stroke="hsla(215, 25%, 35%, 0.3)"
              strokeWidth="0.8"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─── Fish: Medium zone (900-1600px) — new creatures ─── */}
      <div className="ocean-fish-medium absolute inset-0 pointer-events-none">
        {/* Tortue de mer — 450px (shallow-medium boundary) */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:36s] [animation-delay:2s] top-[calc(30vh+450px)]">
          <svg
            className="ocean-fish-svg w-16 h-10"
            viewBox="0 0 64 40"
            fill="none"
          >
            {/* Carapace */}
            <ellipse
              cx="32"
              cy="20"
              rx="16"
              ry="11"
              fill="hsla(140, 40%, 30%, 0.6)"
            />
            {/* Motif hexagonal carapace */}
            <path
              d="M26 14 L32 12 L38 14 L38 20 L32 22 L26 20Z"
              fill="hsla(145, 35%, 24%, 0.4)"
              stroke="hsla(140, 30%, 40%, 0.3)"
              strokeWidth="0.5"
            />
            <path
              d="M22 18 L26 14 M26 20 L22 22 M38 14 L42 18 M38 20 L42 22"
              stroke="hsla(140, 30%, 40%, 0.25)"
              strokeWidth="0.5"
            />
            <path
              d="M32 12 L32 8 M32 22 L32 26"
              stroke="hsla(140, 30%, 40%, 0.2)"
              strokeWidth="0.5"
            />
            {/* Tete */}
            <path
              d="M14 20 C10 18 8 19 8 20 C8 21 10 22 14 20"
              fill="hsla(140, 30%, 45%, 0.55)"
            />
            <circle cx="10" cy="19" r="0.8" fill="hsla(0,0%,10%,0.6)" />
            {/* Palmes avant */}
            <path
              d="M18 14 C14 8 8 6 6 8 C8 10 12 12 18 14"
              fill="hsla(140, 30%, 42%, 0.5)"
            />
            <path
              d="M18 26 C14 32 8 34 6 32 C8 30 12 28 18 26"
              fill="hsla(140, 30%, 42%, 0.5)"
            />
            {/* Palmes arriere */}
            <path
              d="M46 16 C50 12 54 12 56 14 C54 16 50 16 46 16"
              fill="hsla(140, 30%, 42%, 0.45)"
            />
            <path
              d="M46 24 C50 28 54 28 56 26 C54 24 50 24 46 24"
              fill="hsla(140, 30%, 42%, 0.45)"
            />
            {/* Queue */}
            <path
              d="M48 20 C52 20 54 19 56 20 C54 21 52 20 48 20"
              fill="hsla(140, 30%, 42%, 0.4)"
            />
          </svg>
        </div>
        {/* Hippocampe — 650px */}
        <div className="ocean-fish-bank absolute right-[20%] fish-swim-rtl [animation-duration:50s] [animation-delay:6s] top-[calc(30vh+650px)]">
          <svg
            className="ocean-fish-svg w-9 h-14"
            viewBox="0 0 24 40"
            fill="none"
          >
            {/* Couronne */}
            <path
              d="M11 3 L10 1 L12 2 L14 1 L13 3"
              fill="hsla(35, 60%, 50%, 0.5)"
            />
            {/* Tete */}
            <path
              d="M8 6 C8 3 14 3 14 6 C14 8 12 10 10 10 C8 10 8 8 8 6"
              fill="hsla(35, 60%, 50%, 0.6)"
            />
            {/* Museau */}
            <path
              d="M8 7 C5 7 4 8 4 8"
              stroke="hsla(35, 55%, 45%, 0.5)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Oeil */}
            <circle cx="11" cy="6" r="1" fill="hsla(0,0%,10%,0.7)" />
            <circle cx="10.7" cy="5.7" r="0.3" fill="hsla(0,0%,100%,0.8)" />
            {/* Corps segmente en S */}
            <path
              d="M10 10 C14 14 16 18 14 22 C12 26 8 28 10 32 C11 34 12 36 11 38"
              fill="hsla(35, 60%, 50%, 0.6)"
              stroke="hsla(30, 50%, 40%, 0.3)"
              strokeWidth="0.5"
            />
            {/* Segments du ventre */}
            <path
              d="M10 12 L13 13 M10 15 L14 16 M11 18 L14 18 M12 21 L14 20 M11 24 L9 24 M10 27 L8 27 M10 30 L9 29"
              stroke="hsla(35, 50%, 55%, 0.3)"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Nageoire dorsale */}
            <path
              d="M14 14 C17 16 17 20 14 22"
              fill="hsla(35, 55%, 55%, 0.35)"
            />
            {/* Queue enroulee */}
            <path
              d="M11 38 C9 38 8 36 9 34 C10 33 11 33 10 35"
              stroke="hsla(35, 55%, 45%, 0.5)"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        {/* Barracuda — 1100px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:16s] [animation-delay:1s] top-[calc(30vh+1100px)]">
          <svg
            className="ocean-fish-svg w-20 h-5"
            viewBox="0 0 80 20"
            fill="none"
          >
            {/* Corps allonge argente - dos */}
            <path
              d="M4 9 C10 5 30 4 50 6 C60 7 68 8 70 10"
              fill="hsla(210, 30%, 50%, 0.55)"
            />
            {/* Ventre */}
            <path
              d="M4 11 C10 15 30 14 50 13 C60 12 68 11 70 10"
              fill="hsla(210, 25%, 60%, 0.4)"
            />
            {/* Machoire inferieure prognathe */}
            <path d="M4 10 L2 9 L4 9" fill="hsla(210, 30%, 45%, 0.5)" />
            {/* Nageoire dorsale arriere */}
            <path d="M56 6 L58 3 L62 7" fill="hsla(210, 28%, 45%, 0.4)" />
            {/* Nageoire anale */}
            <path d="M56 14 L58 17 L62 13" fill="hsla(210, 28%, 45%, 0.4)" />
            {/* Queue fourchue */}
            <g transform="translate(70, 10)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 L6 -6 L4 -1 L4 1 L6 6 L0 1Z"
                  fill="hsla(210, 30%, 48%, 0.5)"
                />
              </g>
            </g>
            {/* Ligne laterale */}
            <path
              d="M12 10 L64 9"
              stroke="hsla(210, 20%, 55%, 0.25)"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Oeil */}
            <circle cx="9" cy="9" r="1.5" fill="hsla(55, 70%, 60%, 0.7)" />
            <circle cx="9" cy="9" r="0.7" fill="hsla(0,0%,10%,0.8)" />
          </svg>
        </div>
        {/* Requin-marteau — 1200px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:28s] [animation-delay:11s] top-[calc(30vh+1200px)]">
          <svg
            className="ocean-fish-svg w-[80px] h-9"
            viewBox="0 0 80 36"
            fill="none"
          >
            {/* Body - dos sombre */}
            <path
              d="M16 18 C18 14 28 10 44 10 C56 10 64 13 68 16 L68 18"
              fill="hsla(220, 25%, 28%, 0.6)"
            />
            {/* Ventre clair */}
            <path
              d="M16 18 C18 22 28 26 44 26 C56 26 64 23 68 20 L68 18"
              fill="hsla(220, 18%, 42%, 0.4)"
            />
            {/* Hammerhead — flat T-shape */}
            <path
              d="M2 14 C4 12 8 11 14 12 L16 16 L16 20 L14 24 C8 25 4 24 2 22 C1 20 1 16 2 14Z"
              fill="hsla(220, 25%, 30%, 0.55)"
            />
            <path
              d="M2 18 L14 18"
              stroke="hsla(220, 20%, 38%, 0.3)"
              strokeWidth="0.5"
              fill="none"
            />
            {/* Eyes at ends of hammer */}
            <circle cx="4" cy="16" r="1.2" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="3.7" cy="15.7" r="0.4" fill="hsla(0,0%,100%,0.4)" />
            <circle cx="4" cy="20" r="1.2" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="3.7" cy="19.7" r="0.4" fill="hsla(0,0%,100%,0.4)" />
            {/* Dorsal fin */}
            <path d="M38 10 L40 2 L46 10" fill="hsla(220, 22%, 25%, 0.55)" />
            {/* Pectoral fin */}
            <path d="M28 22 L22 30 L32 24" fill="hsla(220, 20%, 32%, 0.45)" />
            {/* Tail */}
            <g transform="translate(68, 18)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C4 -4 6 -8 10 -12 C8 -6 6 -2 4 0 C6 2 8 6 10 12 C6 8 4 4 0 2Z"
                  fill="hsla(220, 25%, 28%, 0.55)"
                />
              </g>
            </g>
            {/* Gills */}
            <path
              d="M22 14 C22 16 22 20 22 22"
              stroke="hsla(220, 18%, 38%, 0.25)"
              strokeWidth="0.6"
              fill="none"
            />
            <path
              d="M24 13.5 C24 16 24 20 24 22.5"
              stroke="hsla(220, 18%, 38%, 0.25)"
              strokeWidth="0.6"
              fill="none"
            />
          </svg>
        </div>
        {/* Thon — 1300px */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:14s] [animation-delay:4s] top-[calc(30vh+1300px)]">
          <svg
            className="ocean-fish-svg w-14 h-7"
            viewBox="0 0 56 28"
            fill="none"
          >
            {/* Corps torpille - dos bleu */}
            <path
              d="M4 14 C6 8 16 4 28 4 C38 4 44 8 46 12 L46 14"
              fill="hsla(215, 45%, 40%, 0.55)"
            />
            {/* Ventre argente */}
            <path
              d="M4 14 C6 20 16 24 28 24 C38 24 44 20 46 16 L46 14"
              fill="hsla(215, 30%, 55%, 0.4)"
            />
            {/* Nageoire dorsale */}
            <path d="M22 4 L24 1 L28 5" fill="hsla(215, 40%, 38%, 0.45)" />
            {/* Petites pinnules dorsales */}
            <path
              d="M32 5 L33 3 M35 5.5 L36 4 M38 6 L39 4.5"
              stroke="hsla(215, 35%, 42%, 0.35)"
              strokeWidth="0.7"
            />
            {/* Nageoire pectorale */}
            <path
              d="M14 16 C16 20 20 20 18 16"
              fill="hsla(215, 35%, 48%, 0.35)"
            />
            {/* Queue en croissant lunaire */}
            <g transform="translate(46, 14)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -1 C2 -2 4 -6 6 -10 C5 -4 4 -1 3 0 C4 1 5 4 6 10 C4 6 2 2 0 1Z"
                  fill="hsla(215, 40%, 42%, 0.5)"
                />
              </g>
            </g>
            {/* Carene caudale */}
            <path d="M43 13 L46 14 L43 15" fill="hsla(215, 35%, 50%, 0.3)" />
            {/* Oeil */}
            <circle cx="9" cy="13" r="1.8" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="8.5" cy="12.5" r="0.5" fill="hsla(0,0%,100%,0.5)" />
          </svg>
        </div>
        {/* Grande meduse — 1500px */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl jellyfish-float [animation-duration:34s] [animation-delay:7s] top-[calc(30vh+1500px)]">
          <svg
            className="ocean-fish-svg w-12 h-14"
            viewBox="0 0 48 56"
            fill="hsla(270, 40%, 55%, 0.4)"
          >
            <ellipse cx="24" cy="14" rx="18" ry="12" />
            <path
              d="M8 26 Q14 46 24 52 Q34 46 40 26"
              stroke="hsla(270, 35%, 60%, 0.35)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M16 26 Q20 40 24 48"
              stroke="hsla(270, 35%, 60%, 0.3)"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M32 26 Q28 40 24 48"
              stroke="hsla(270, 35%, 60%, 0.3)"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>
        </div>
        {/* Calmar — 1900px (deep boundary) */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:24s] [animation-delay:9s] top-[calc(30vh+1900px)]">
          <svg
            className="ocean-fish-svg w-12 h-6"
            viewBox="0 0 48 24"
            fill="none"
          >
            {/* Manteau */}
            <path
              d="M20 12 C22 6 30 4 38 6 C42 7 44 10 44 12 C44 14 42 17 38 18 C30 20 22 18 20 12Z"
              fill="hsla(350, 30%, 30%, 0.55)"
            />
            {/* Nageoires laterales */}
            <path d="M36 6 C38 2 42 2 44 6" fill="hsla(350, 28%, 35%, 0.4)" />
            <path
              d="M36 18 C38 22 42 22 44 18"
              fill="hsla(350, 28%, 35%, 0.4)"
            />
            {/* Tentacules */}
            <path
              d="M20 10 C16 8 10 7 4 6"
              stroke="hsla(350, 25%, 35%, 0.4)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 11 C15 10 8 10 2 10"
              stroke="hsla(350, 25%, 35%, 0.35)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 12 C14 12 8 12 2 12"
              stroke="hsla(350, 25%, 35%, 0.4)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 13 C15 14 8 14 2 14"
              stroke="hsla(350, 25%, 35%, 0.35)"
              strokeWidth="0.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 14 C16 16 10 17 4 18"
              stroke="hsla(350, 25%, 35%, 0.4)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* Bras chasseurs plus longs */}
            <path
              d="M20 9 C12 5 6 4 1 5"
              stroke="hsla(350, 25%, 38%, 0.35)"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M20 15 C12 19 6 20 1 19"
              stroke="hsla(350, 25%, 38%, 0.35)"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
            />
            {/* Grand oeil */}
            <circle cx="28" cy="11" r="2.5" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="27.5" cy="10.5" r="1" fill="hsla(0,0%,100%,0.5)" />
          </svg>
        </div>
        {/* Dauphin — 950px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:12s] [animation-delay:0s] top-[calc(30vh+950px)]">
          <svg
            className="ocean-fish-svg w-16 h-8"
            viewBox="0 0 64 32"
            fill="none"
          >
            {/* Dos gris-bleu */}
            <path
              d="M4 16 C6 12 14 8 24 8 C34 8 44 10 50 14 C52 15 54 15 56 14"
              fill="hsla(210, 30%, 50%, 0.55)"
            />
            {/* Ventre clair */}
            <path
              d="M4 16 C6 20 14 24 24 24 C34 24 44 22 50 18 C52 17 54 17 56 18"
              fill="hsla(210, 20%, 65%, 0.4)"
            />
            {/* Rostre (bec) */}
            <path
              d="M4 16 C2 15 0 15.5 0 16 C0 16.5 2 17 4 16"
              fill="hsla(210, 25%, 48%, 0.5)"
            />
            {/* Melon (front arrondi) */}
            <path d="M6 14 C8 12 10 12 12 13" fill="hsla(210, 30%, 50%, 0.5)" />
            {/* Nageoire dorsale */}
            <path d="M30 8 C32 2 36 2 38 8" fill="hsla(210, 30%, 45%, 0.5)" />
            {/* Nageoire pectorale */}
            <path
              d="M18 18 C16 24 22 26 22 20"
              fill="hsla(210, 28%, 50%, 0.4)"
            />
            {/* Queue (nageoire caudale) */}
            <g transform="translate(56, 16)">
              <g className="ocean-fish-tail">
                <path
                  d="M0 -2 C2 -4 4 -8 6 -10 C4 -4 2 -2 2 0 C2 2 4 4 6 10 C4 8 2 4 0 2Z"
                  fill="hsla(210, 30%, 48%, 0.5)"
                />
              </g>
            </g>
            {/* Oeil */}
            <circle cx="10" cy="15" r="1.5" fill="hsla(0,0%,10%,0.6)" />
            <circle cx="9.7" cy="14.7" r="0.5" fill="hsla(0,0%,100%,0.5)" />
            {/* Sourire */}
            <path
              d="M4 17 C5 18 7 18 8 17"
              stroke="hsla(210, 25%, 45%, 0.3)"
              strokeWidth="0.5"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─── Marine flora: kelp, coral, anemones ─── */}
      <div className="ocean-flora-zone absolute inset-0 pointer-events-none">
        {/* Kelp forest — gauche, 3 tiges ondulantes */}
        <div className="absolute left-[8%] top-[calc(30vh+600px)]">
          <svg
            className="ocean-kelp w-6 h-32 [animation-delay:0s]"
            viewBox="0 0 24 128"
            fill="none"
          >
            <path
              d="M12 128 C10 110 8 95 10 80 C12 65 14 50 11 35 C9 22 12 10 13 0"
              stroke="hsla(135, 45%, 30%, 0.5)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M10 80 C6 75 4 72 3 68"
              stroke="hsla(135, 40%, 35%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M11 55 C15 50 18 48 20 45"
              stroke="hsla(135, 40%, 35%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M11 35 C7 30 5 26 4 22"
              stroke="hsla(135, 40%, 35%, 0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx="13"
              cy="2"
              rx="4"
              ry="2"
              fill="hsla(135, 45%, 32%, 0.3)"
            />
          </svg>
        </div>
        <div className="absolute left-[5%] top-[calc(30vh+640px)]">
          <svg
            className="ocean-kelp-alt w-5 h-28 [animation-delay:1s]"
            viewBox="0 0 20 112"
            fill="none"
          >
            <path
              d="M10 112 C8 95 12 80 10 60 C8 42 11 25 10 4"
              stroke="hsla(140, 42%, 28%, 0.45)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M10 75 C14 70 16 67 18 63"
              stroke="hsla(140, 38%, 32%, 0.35)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M10 45 C6 40 4 37 3 33"
              stroke="hsla(140, 38%, 32%, 0.35)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <div className="absolute left-[11%] top-[calc(30vh+660px)]">
          <svg
            className="ocean-kelp w-4 h-24 [animation-delay:2.5s]"
            viewBox="0 0 16 96"
            fill="none"
          >
            <path
              d="M8 96 C6 80 10 60 8 40 C6 22 9 8 8 0"
              stroke="hsla(130, 40%, 32%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8 50 C12 45 14 42 15 38"
              stroke="hsla(130, 36%, 35%, 0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Kelp forest — droite */}
        <div className="absolute right-[6%] top-[calc(30vh+580px)]">
          <svg
            className="ocean-kelp-alt w-6 h-36 [animation-delay:0.5s]"
            viewBox="0 0 24 144"
            fill="none"
          >
            <path
              d="M12 144 C14 120 10 100 12 75 C14 55 10 35 12 8"
              stroke="hsla(138, 44%, 28%, 0.5)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12 90 C8 85 5 82 3 78"
              stroke="hsla(138, 40%, 32%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M12 55 C16 48 19 45 21 40"
              stroke="hsla(138, 40%, 32%, 0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx="12"
              cy="10"
              rx="5"
              ry="2.5"
              fill="hsla(138, 44%, 30%, 0.3)"
            />
          </svg>
        </div>
        <div className="absolute right-[10%] top-[calc(30vh+620px)]">
          <svg
            className="ocean-kelp w-4 h-26 [animation-delay:3s]"
            viewBox="0 0 16 104"
            fill="none"
          >
            <path
              d="M8 104 C10 85 6 65 8 45 C10 28 8 12 8 0"
              stroke="hsla(132, 38%, 30%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M8 65 C4 60 2 57 1 53"
              stroke="hsla(132, 35%, 34%, 0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Corail — zone peu profonde, gauche-centre */}
        <div className="absolute left-[25%] top-[calc(30vh+850px)]">
          <svg className="w-20 h-12" viewBox="0 0 80 48" fill="none">
            {/* Corail branche rouge */}
            <path
              d="M20 48 C20 35 18 25 14 18 C12 14 10 8 8 4"
              stroke="hsla(0, 55%, 45%, 0.45)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M14 18 C10 14 6 12 4 8"
              stroke="hsla(0, 50%, 42%, 0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M20 48 C22 32 24 22 28 14 C30 10 34 6 36 2"
              stroke="hsla(355, 60%, 48%, 0.45)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M28 14 C32 10 36 10 38 6"
              stroke="hsla(355, 55%, 45%, 0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Corail cerveau arrondi */}
            <ellipse
              cx="55"
              cy="38"
              rx="12"
              ry="8"
              fill="hsla(30, 50%, 45%, 0.35)"
            />
            <path
              d="M46 36 C48 34 50 36 52 34 C54 32 56 34 58 32 C60 34 62 32 64 34"
              stroke="hsla(30, 45%, 50%, 0.25)"
              strokeWidth="0.8"
              fill="none"
            />
            <path
              d="M48 40 C50 38 52 40 54 38 C56 36 58 38 60 36 C62 38 64 36 66 38"
              stroke="hsla(30, 45%, 50%, 0.2)"
              strokeWidth="0.8"
              fill="none"
            />
            {/* Corail tubulaire */}
            <path
              d="M72 48 C72 40 70 35 72 30"
              stroke="hsla(15, 55%, 50%, 0.4)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M76 48 C76 42 78 36 76 32"
              stroke="hsla(15, 50%, 48%, 0.35)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="72" cy="29" r="2" fill="hsla(15, 55%, 55%, 0.3)" />
            <circle cx="76" cy="31" r="1.8" fill="hsla(15, 50%, 52%, 0.25)" />
          </svg>
        </div>

        {/* Corail — zone droite */}
        <div className="absolute right-[20%] top-[calc(30vh+900px)]">
          <svg className="w-16 h-10" viewBox="0 0 64 40" fill="none">
            {/* Corail eventail */}
            <path
              d="M32 40 C30 30 22 18 14 10 C10 6 6 4 4 2"
              stroke="hsla(340, 45%, 45%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M32 40 C32 28 28 18 24 12"
              stroke="hsla(340, 42%, 42%, 0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M32 40 C34 28 38 18 42 10 C44 6 48 4 50 2"
              stroke="hsla(340, 48%, 48%, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M32 40 C34 30 40 20 46 14"
              stroke="hsla(340, 44%, 45%, 0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lignes transversales (filet de gorgone) */}
            <path
              d="M10 8 C18 12 26 14 34 12 C40 10 46 8 50 4"
              stroke="hsla(340, 40%, 50%, 0.2)"
              strokeWidth="0.6"
              fill="none"
            />
            <path
              d="M18 16 C24 18 32 18 38 16 C42 14 46 12 48 10"
              stroke="hsla(340, 40%, 50%, 0.15)"
              strokeWidth="0.6"
              fill="none"
            />
          </svg>
        </div>

        {/* Anemones de mer — zone peu profonde */}
        <div className="absolute left-[45%] top-[calc(30vh+820px)]">
          <svg
            className="ocean-anemone w-10 h-8"
            viewBox="0 0 40 32"
            fill="none"
          >
            {/* Base */}
            <ellipse
              cx="20"
              cy="28"
              rx="10"
              ry="4"
              fill="hsla(350, 50%, 40%, 0.4)"
            />
            {/* Tentacules */}
            <path
              d="M10 26 C8 20 6 14 5 8"
              stroke="hsla(350, 55%, 55%, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M13 25 C12 18 10 12 9 6"
              stroke="hsla(350, 52%, 52%, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M16 24 C16 17 15 11 14 4"
              stroke="hsla(350, 55%, 55%, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M20 24 C20 16 20 10 20 2"
              stroke="hsla(350, 58%, 58%, 0.45)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M24 24 C24 17 25 11 26 4"
              stroke="hsla(350, 55%, 55%, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M27 25 C28 18 30 12 31 6"
              stroke="hsla(350, 52%, 52%, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M30 26 C32 20 34 14 35 8"
              stroke="hsla(350, 55%, 55%, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Bout des tentacules (points lumineux) */}
            <circle cx="5" cy="7" r="1.2" fill="hsla(350, 60%, 65%, 0.4)" />
            <circle cx="14" cy="3" r="1" fill="hsla(350, 60%, 65%, 0.35)" />
            <circle cx="20" cy="1" r="1.2" fill="hsla(350, 65%, 68%, 0.45)" />
            <circle cx="26" cy="3" r="1" fill="hsla(350, 60%, 65%, 0.35)" />
            <circle cx="35" cy="7" r="1.2" fill="hsla(350, 60%, 65%, 0.4)" />
          </svg>
        </div>

      </div>

      {/* Poulpe — zone moyenne, nage lente et elegante (inside medium zone) */}
      <div className="ocean-fish-medium absolute inset-0 pointer-events-none">
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:45s] [animation-delay:12s] top-[calc(30vh+1050px)]">
          <svg
            className="ocean-fish-svg w-16 h-14"
            viewBox="0 0 64 56"
            fill="none"
          >
            {/* Manteau (tete) */}
            <path
              d="M24 8 C28 2 36 2 40 8 C44 14 44 22 40 26 C36 28 28 28 24 26 C20 22 20 14 24 8Z"
              fill="hsla(10, 50%, 38%, 0.55)"
            />
            {/* Yeux */}
            <circle cx="28" cy="16" r="3" fill="hsla(50, 70%, 80%, 0.6)" />
            <circle cx="28" cy="16" r="1.5" fill="hsla(0,0%,8%,0.8)" />
            <circle cx="36" cy="16" r="3" fill="hsla(50, 70%, 80%, 0.6)" />
            <circle cx="36" cy="16" r="1.5" fill="hsla(0,0%,8%,0.8)" />
            {/* Tentacules ondulants */}
            <path
              d="M26 28 C22 34 18 42 14 50 C12 52 10 54 8 52"
              stroke="hsla(10, 45%, 35%, 0.45)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M30 28 C28 36 24 44 22 50 C20 52 18 53 17 51"
              stroke="hsla(10, 42%, 38%, 0.4)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M34 28 C36 36 40 44 42 50 C44 52 46 53 47 51"
              stroke="hsla(10, 42%, 38%, 0.4)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M38 28 C42 34 46 42 50 50 C52 52 54 54 56 52"
              stroke="hsla(10, 45%, 35%, 0.45)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tentacules courts lateraux */}
            <path
              d="M24 24 C18 28 14 34 12 40"
              stroke="hsla(10, 40%, 36%, 0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M40 24 C46 28 50 34 52 40"
              stroke="hsla(10, 40%, 36%, 0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tentacules centraux */}
            <path
              d="M28 28 C26 38 28 46 26 54"
              stroke="hsla(10, 40%, 36%, 0.3)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M36 28 C38 38 36 46 38 54"
              stroke="hsla(10, 40%, 36%, 0.3)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Ventouses (petits cercles sur un tentacule) */}
            <circle cx="20" cy="36" r="0.8" fill="hsla(10, 35%, 45%, 0.25)" />
            <circle cx="18" cy="42" r="0.7" fill="hsla(10, 35%, 45%, 0.2)" />
            <circle cx="16" cy="48" r="0.6" fill="hsla(10, 35%, 45%, 0.18)" />
          </svg>
        </div>
      </div>

      {/* ─── Stars (sky area — night only) ─── */}
      <div className="ocean-stars-wrap absolute inset-x-0 top-0 h-[32vh]">
        {/* Static stars — varied sizes & opacities */}
        <div className="ocean-star top-[8%] left-[5%] opacity-[0.7]" />
        <div className="ocean-star top-[12%] left-[14%] opacity-[0.4]" />
        <div className="ocean-star star-lg top-[6%] left-[22%] opacity-[0.9]" />
        <div className="ocean-star top-[18%] left-[30%] opacity-[0.5]" />
        <div className="ocean-star star-twinkle top-[10%] left-[38%] opacity-[0.8]" />
        <div className="ocean-star top-[22%] left-[45%] opacity-[0.3]" />
        <div className="ocean-star star-lg top-[5%] left-[52%] opacity-[0.6]" />
        <div className="ocean-star top-[15%] left-[58%] opacity-[0.9]" />
        <div className="ocean-star star-twinkle top-[8%] left-[65%] opacity-[0.5]" />
        <div className="ocean-star top-[20%] left-[72%] opacity-[0.7]" />
        <div className="ocean-star star-lg top-[12%] left-[80%] opacity-[0.4]" />
        <div className="ocean-star top-[6%] left-[88%] opacity-[0.8]" />
        <div className="ocean-star top-[25%] left-[93%] opacity-[0.3]" />
        <div className="ocean-star top-[28%] left-[10%] opacity-[0.6]" />
        <div className="ocean-star star-twinkle top-[32%] left-[20%] opacity-[0.5]" />
        <div className="ocean-star top-[35%] left-[35%] opacity-[0.4]" />
        <div className="ocean-star star-lg top-[30%] left-[50%] opacity-[0.7]" />
        <div className="ocean-star top-[38%] left-[60%] opacity-[0.3]" />
        <div className="ocean-star top-[42%] left-[75%] opacity-[0.6]" />
        <div className="ocean-star star-twinkle top-[35%] left-[85%] opacity-[0.8]" />
        <div className="ocean-star top-[45%] left-[8%] opacity-[0.5]" />
        <div className="ocean-star top-[50%] left-[25%] opacity-[0.3]" />
        <div className="ocean-star star-lg top-[48%] left-[42%] opacity-[0.6]" />
        <div className="ocean-star top-[55%] left-[55%] opacity-[0.4]" />
        <div className="ocean-star top-[52%] left-[68%] opacity-[0.7]" />
        <div className="ocean-star star-twinkle top-[58%] left-[82%] opacity-[0.5]" />
        <div className="ocean-star top-[62%] left-[15%] opacity-[0.3]" />
        <div className="ocean-star top-[65%] left-[33%] opacity-[0.6]" />
        <div className="ocean-star star-lg top-[60%] left-[48%] opacity-[0.4]" />
        <div className="ocean-star top-[68%] left-[62%] opacity-[0.5]" />
        <div className="ocean-star top-[72%] left-[78%] opacity-[0.7]" />
        <div className="ocean-star top-[70%] left-[92%] opacity-[0.3]" />
        <div className="ocean-star top-[75%] left-[3%] opacity-[0.4]" />
        <div className="ocean-star star-twinkle top-[78%] left-[40%] opacity-[0.6]" />
        <div className="ocean-star top-[82%] left-[57%] opacity-[0.5]" />
        <div className="ocean-star top-[85%] left-[70%] opacity-[0.3]" />
        {/* Shooting star — CSS animation with long delay */}
        <div className="ocean-shooting-star" />
      </div>

      {/* ─── Bioluminescent plankton (underwater — night only, deep zones 1800px+) ─── */}
      <div className="ocean-biolum-wrap absolute inset-x-0 top-[calc(30vh+1800px)] h-[1500px]">
        {/* Cyan cluster */}
        <div className="ocean-biolum-particle biolum-cyan top-[5%] left-[15%] [animation-delay:0s]" />
        <div className="ocean-biolum-particle biolum-cyan top-[25%] left-[68%] [animation-delay:1.5s]" />
        <div className="ocean-biolum-particle biolum-cyan top-[55%] left-[42%] [animation-delay:3s]" />
        <div className="ocean-biolum-particle biolum-cyan top-[80%] left-[85%] [animation-delay:0.8s]" />
        {/* Green */}
        <div className="ocean-biolum-particle biolum-green top-[10%] left-[78%] [animation-delay:0.6s]" />
        <div className="ocean-biolum-particle biolum-green top-[40%] left-[25%] [animation-delay:2.2s]" />
        <div className="ocean-biolum-particle biolum-green top-[70%] left-[52%] [animation-delay:4.5s]" />
        {/* Magenta */}
        <div className="ocean-biolum-particle biolum-magenta top-[15%] left-[48%] [animation-delay:1s]" />
        <div className="ocean-biolum-particle biolum-magenta top-[50%] left-[88%] [animation-delay:3.5s]" />
        <div className="ocean-biolum-particle biolum-magenta top-[85%] left-[12%] [animation-delay:2.8s]" />
        {/* Purple */}
        <div className="ocean-biolum-particle biolum-purple top-[20%] left-[55%] [animation-delay:1.6s]" />
        <div className="ocean-biolum-particle biolum-purple top-[60%] left-[18%] [animation-delay:3.2s]" />
        <div className="ocean-biolum-particle biolum-purple top-[90%] left-[75%] [animation-delay:5s]" />
        {/* Teal */}
        <div className="ocean-biolum-particle biolum-teal top-[30%] left-[82%] [animation-delay:2.6s]" />
        <div className="ocean-biolum-particle biolum-teal top-[65%] left-[5%] [animation-delay:0.2s]" />
      </div>

      {/* ─── Bioluminescent fish (night only — distributed across depth zones) ─── */}
      <div className="ocean-fish-biolum absolute inset-0 pointer-events-none">
        {/* Cyan glowing fish — shallow 400px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:24s] [animation-delay:1s] top-[calc(30vh+400px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-cyan w-6 h-3.5"
            viewBox="0 0 24 14"
            fill="hsla(185, 100%, 72%, 0.85)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
            <circle cx="8" cy="6" r="1.5" fill="hsla(185, 100%, 92%, 0.95)" />
          </svg>
          <svg
            className="ocean-fish-svg biolum-fish-glow-cyan w-5 h-3 absolute left-6 top-1 [animation-delay:0.4s]"
            viewBox="0 0 24 14"
            fill="hsla(190, 100%, 68%, 0.8)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
          </svg>
        </div>
        {/* Green glowing fish — mid 1000px */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:26s] [animation-delay:6s] top-[calc(30vh+1000px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-green w-7 h-4"
            viewBox="0 0 28 16"
            fill="hsla(140, 90%, 60%, 0.85)"
          >
            <path d="M3 8 Q12 2 22 8 Q12 14 3 8 Z" />
            <g transform="translate(22, 8)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L6 -3 L6 3 Z" />
              </g>
            </g>
            <circle cx="10" cy="7" r="1.8" fill="hsla(140, 95%, 88%, 0.95)" />
          </svg>
          <svg
            className="ocean-fish-svg biolum-fish-glow-green w-5 h-3 absolute right-5 -top-0.5 [animation-delay:0.6s]"
            viewBox="0 0 24 14"
            fill="hsla(148, 85%, 55%, 0.8)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
          </svg>
        </div>
        {/* Magenta glowing fish — mid-deep 1400px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:30s] [animation-delay:3s] top-[calc(30vh+1400px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-magenta w-6 h-3.5"
            viewBox="0 0 24 14"
            fill="hsla(305, 85%, 68%, 0.85)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
            <circle cx="8" cy="6" r="1.5" fill="hsla(305, 90%, 90%, 0.95)" />
          </svg>
        </div>
        {/* Purple glowing fish — deep 2000px */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:34s] [animation-delay:10s] top-[calc(30vh+2000px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-purple w-7 h-4"
            viewBox="0 0 28 16"
            fill="hsla(270, 88%, 70%, 0.85)"
          >
            <path d="M3 8 Q12 2 22 8 Q12 14 3 8 Z" />
            <g transform="translate(22, 8)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L6 -3 L6 3 Z" />
              </g>
            </g>
            <circle cx="10" cy="7" r="1.8" fill="hsla(270, 95%, 90%, 0.95)" />
          </svg>
          <svg
            className="ocean-fish-svg biolum-fish-glow-purple w-5 h-3 absolute right-6 top-1 [animation-delay:0.5s]"
            viewBox="0 0 24 14"
            fill="hsla(275, 85%, 68%, 0.8)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
          </svg>
        </div>
        {/* Amber glowing fish — medium 1200px */}
        <div className="ocean-fish-bank absolute left-0 fish-swim-ltr [animation-duration:22s] [animation-delay:8s] top-[calc(30vh+1200px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-amber w-5 h-3"
            viewBox="0 0 24 14"
            fill="hsla(38, 100%, 65%, 0.85)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
            <circle cx="8" cy="6" r="1.2" fill="hsla(45, 100%, 90%, 0.95)" />
          </svg>
        </div>
        {/* Teal glowing fish — deep 2400px */}
        <div className="ocean-fish-bank absolute right-0 fish-swim-rtl [animation-duration:28s] [animation-delay:5s] top-[calc(30vh+2400px)]">
          <svg
            className="ocean-fish-svg biolum-fish-glow-teal w-6 h-3.5"
            viewBox="0 0 24 14"
            fill="hsla(168, 90%, 58%, 0.85)"
          >
            <path d="M2 7 Q10 2 19 7 Q10 12 2 7 Z" />
            <g transform="translate(19, 7)">
              <g className="ocean-fish-tail">
                <path d="M0 0 L5 -2.5 L5 2.5 Z" />
              </g>
            </g>
            <circle cx="8" cy="6" r="1.5" fill="hsla(168, 95%, 85%, 0.95)" />
          </svg>
        </div>
      </div>

      </div>{/* end ocean-scroll-layer */}

      {/* Halos appended dynamically via handleClick */}
    </div>
  );
}
