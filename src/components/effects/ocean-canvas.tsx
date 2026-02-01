"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Ocean Background - Enhanced Marine Life Edition
 * 
 * DEPTH ZONES:
 * - Surface (0-15%): Tropical fish schools, bubbles, intense sun rays
 * - Middle (15-50%): Sea turtles, manta rays, bioluminescent jellyfish
 * - Deep (50-100%): Shark silhouettes, abyssal fish, marine snow, anemones
 * 
 * CAMERA MOVEMENT:
 * - Pages ordered left to right according to navbar
 * - Navigate right → camera moves right
 * - Navigate left → camera moves left
 * - Page change → automatic rise to surface
 */

// Page order in navbar (left to right)
const PAGE_ORDER = [
  "", // home (/)
  "about",
  "explorer", 
  "centers",
  "contact",
  "login",
  "register",
];

function getPageIndex(pathname: string): number {
  const segments = pathname.split("/").filter(Boolean);
  const pageSegment = segments[1] || "";
  const index = PAGE_ORDER.indexOf(pageSegment);
  return index >= 0 ? index : 0;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// ===========================================
// TYPE DEFINITIONS
// ===========================================

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
};

type JellyfishData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  glowColor: string;
  delay: number;
};

type FishData = {
  id: number;
  y: number;
  size: number;
  color: string;
  direction: number;
  speed: number;
};

type TropicalFishData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  finColor: string;
  direction: number;
  speed: number;
  schoolOffset: number;
};

type BubbleData = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
};

type SeaTurtleData = {
  id: number;
  y: number;
  size: number;
  color: string;
  direction: number;
  speed: number;
};

type MantaRayData = {
  id: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
};

type SharkData = {
  id: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
};

type AbyssalFishData = {
  id: number;
  x: number;
  y: number;
  size: number;
  glowColor: string;
  duration: number;
  delay: number;
};

type MarineSnowData = {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
};

type SeaAnemoneData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  tentacleCount: number;
  side: "left" | "right";
};

// ===========================================
// GENERATORS
// ===========================================

function generateParticles(count: number): Particle[] {
  const colors = ["#22D3EE", "#F472B6", "#FBBF24", "#34D399", "#A78BFA", "#60A5FA", "#FB7185", "#818CF8"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i * 7 + 1) * 100,
    y: seededRandom(i * 7 + 2) * 100,
    size: 3 + seededRandom(i * 7 + 3) * 8,
    color: colors[Math.floor(seededRandom(i * 7 + 4) * colors.length)] ?? "#22D3EE",
    opacity: 0.5 + seededRandom(i * 7 + 5) * 0.5,
    duration: 4 + seededRandom(i * 7 + 6) * 6,
    delay: seededRandom(i * 7 + 7) * 5,
  }));
}

function generateJellyfish(count: number): JellyfishData[] {
  const jellyfishColors = [
    { color: "#8B5CF6", glow: "#A78BFA" },
    { color: "#22D3EE", glow: "#67E8F9" },
    { color: "#3B82F6", glow: "#60A5FA" },
    { color: "#EC4899", glow: "#F472B6" },
    { color: "#06B6D4", glow: "#22D3EE" },
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const colorSet = jellyfishColors[i % jellyfishColors.length] ?? jellyfishColors[0];
    return {
      id: i,
      x: 5 + seededRandom(i * 5 + 1) * 90,
      y: 20 + seededRandom(i * 5 + 2) * 50, // Middle zone
      size: 70 + seededRandom(i * 5 + 3) * 70,
      color: colorSet.color,
      glowColor: colorSet.glow,
      delay: seededRandom(i * 5 + 4) * 3,
    };
  });
}

function generateFish(count: number): FishData[] {
  const fishColors = ["#64748B", "#475569", "#94A3B8", "#334155"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 50 + seededRandom(i * 4 + 2) * 45,
    size: 12 + seededRandom(i * 4 + 3) * 20,
    color: fishColors[Math.floor(seededRandom(i * 4 + 4) * fishColors.length)] ?? "#64748B",
    direction: seededRandom(i * 4 + 5) > 0.5 ? 1 : -1,
    speed: 12 + seededRandom(i * 4 + 6) * 18,
  }));
}

// Surface zone generators (0-15%)
function generateTropicalFish(count: number): TropicalFishData[] {
  const tropicalColors = [
    { body: "#FF6B6B", fin: "#FFA500" }, // Red-orange
    { body: "#4ECDC4", fin: "#45B7D1" }, // Teal
    { body: "#FFE66D", fin: "#F7D794" }, // Yellow
    { body: "#95E1D3", fin: "#EAFFD0" }, // Mint
    { body: "#DDA0DD", fin: "#E6E6FA" }, // Lavender
    { body: "#FF7F50", fin: "#FFD700" }, // Coral-gold
    { body: "#00CED1", fin: "#7FFFD4" }, // Dark cyan
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const colorSet = tropicalColors[i % tropicalColors.length] ?? tropicalColors[0];
    const schoolId = Math.floor(i / 4); // Groups of 4
    return {
      id: i,
      x: seededRandom(i * 6 + 1) * 100,
      y: 5 + seededRandom(i * 6 + 2) * 12, // Top 15%
      size: 8 + seededRandom(i * 6 + 3) * 12,
      color: colorSet.body,
      finColor: colorSet.fin,
      direction: seededRandom(schoolId) > 0.5 ? 1 : -1,
      speed: 8 + seededRandom(i * 6 + 4) * 8,
      schoolOffset: (i % 4) * 2 + seededRandom(i * 6 + 5) * 3,
    };
  });
}

function generateBubbles(count: number): BubbleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i * 3 + 1) * 100,
    size: 4 + seededRandom(i * 3 + 2) * 12,
    duration: 6 + seededRandom(i * 3 + 3) * 8,
    delay: seededRandom(i * 3 + 4) * 10,
  }));
}

// Middle zone generators (15-50%)
function generateSeaTurtles(count: number): SeaTurtleData[] {
  const turtleColors = ["#2D5016", "#3D6B1E", "#4A7C23", "#5C9127"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 25 + seededRandom(i * 5 + 1) * 20, // 25-45%
    size: 60 + seededRandom(i * 5 + 2) * 40,
    color: turtleColors[i % turtleColors.length] ?? "#3D6B1E",
    direction: seededRandom(i * 5 + 3) > 0.5 ? 1 : -1,
    speed: 25 + seededRandom(i * 5 + 4) * 15, // Slow
  }));
}

function generateMantaRays(count: number): MantaRayData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 30 + seededRandom(i * 4 + 1) * 15, // 30-45%
    size: 100 + seededRandom(i * 4 + 2) * 60,
    direction: seededRandom(i * 4 + 3) > 0.5 ? 1 : -1,
    speed: 20 + seededRandom(i * 4 + 4) * 10, // Graceful
  }));
}

// Deep zone generators (50-100%)
function generateSharks(count: number): SharkData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 60 + seededRandom(i * 4 + 1) * 30, // 60-90%
    size: 80 + seededRandom(i * 4 + 2) * 50,
    direction: seededRandom(i * 4 + 3) > 0.5 ? 1 : -1,
    speed: 15 + seededRandom(i * 4 + 4) * 10,
  }));
}

function generateAbyssalFish(count: number): AbyssalFishData[] {
  const glowColors = ["#00FFFF", "#FF00FF", "#00FF00", "#FFFF00", "#FF6B6B"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i * 5 + 1) * 100,
    y: 70 + seededRandom(i * 5 + 2) * 25, // 70-95%
    size: 6 + seededRandom(i * 5 + 3) * 10,
    glowColor: glowColors[i % glowColors.length] ?? "#00FFFF",
    duration: 2 + seededRandom(i * 5 + 4) * 3,
    delay: seededRandom(i * 5 + 5) * 4,
  }));
}

function generateMarineSnow(count: number): MarineSnowData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i * 3 + 1) * 100,
    size: 1 + seededRandom(i * 3 + 2) * 3,
    duration: 10 + seededRandom(i * 3 + 3) * 15,
    delay: seededRandom(i * 3 + 4) * 20,
  }));
}

function generateSeaAnemones(count: number): SeaAnemoneData[] {
  const anemoneColors = ["#FF6B6B", "#FF8E72", "#FFA07A", "#E6735C", "#D35400"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: i % 2 === 0 ? seededRandom(i * 4 + 1) * 8 : 92 + seededRandom(i * 4 + 1) * 8,
    y: 75 + seededRandom(i * 4 + 2) * 20, // 75-95%
    size: 40 + seededRandom(i * 4 + 3) * 30,
    color: anemoneColors[i % anemoneColors.length] ?? "#FF6B6B",
    tentacleCount: 8 + Math.floor(seededRandom(i * 4 + 4) * 6),
    side: i % 2 === 0 ? "left" : "right",
  }));
}

// ===========================================
// SVG COMPONENTS
// ===========================================

function TropicalFishSVG({ color, finColor, direction }: { color: string; finColor: string; direction: number }) {
  return (
    <svg 
      viewBox="0 0 50 30" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body */}
      <ellipse cx="22" cy="15" rx="16" ry="10" fill={color} />
      {/* Tail */}
      <polygon points="38,15 50,5 50,25" fill={finColor} />
      {/* Dorsal fin */}
      <path d="M15,5 Q22,0 28,5 L22,8 Z" fill={finColor} />
      {/* Pectoral fin */}
      <ellipse cx="20" cy="18" rx="5" ry="3" fill={finColor} fillOpacity="0.7" />
      {/* Eye */}
      <circle cx="12" cy="13" r="3" fill="white" />
      <circle cx="11" cy="12" r="1.5" fill="black" />
      {/* Stripes for tropical look */}
      <path d="M18,6 Q22,15 18,24" stroke={finColor} strokeWidth="2" fill="none" strokeOpacity="0.5" />
      <path d="M26,8 Q28,15 26,22" stroke={finColor} strokeWidth="1.5" fill="none" strokeOpacity="0.4" />
    </svg>
  );
}

function SeaTurtleSVG({ color, direction }: { color: string; direction: number }) {
  const shellColor = color;
  const skinColor = "#8B7355";
  
  return (
    <svg 
      viewBox="0 0 80 50" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Shell */}
      <ellipse cx="40" cy="25" rx="25" ry="18" fill={shellColor} />
      {/* Shell pattern */}
      <ellipse cx="40" cy="25" rx="18" ry="12" fill={shellColor} stroke="#2D5016" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M25,25 L40,12 L55,25" stroke="#2D5016" strokeWidth="1" strokeOpacity="0.3" fill="none" />
      <path d="M25,25 L40,38 L55,25" stroke="#2D5016" strokeWidth="1" strokeOpacity="0.3" fill="none" />
      {/* Head */}
      <ellipse cx="68" cy="25" rx="8" ry="6" fill={skinColor} />
      <circle cx="72" cy="23" r="1.5" fill="black" />
      {/* Flippers */}
      <ellipse cx="30" cy="10" rx="12" ry="5" fill={skinColor} transform="rotate(-30 30 10)" />
      <ellipse cx="30" cy="40" rx="12" ry="5" fill={skinColor} transform="rotate(30 30 40)" />
      <ellipse cx="55" cy="12" rx="8" ry="4" fill={skinColor} transform="rotate(-20 55 12)" />
      <ellipse cx="55" cy="38" rx="8" ry="4" fill={skinColor} transform="rotate(20 55 38)" />
      {/* Tail */}
      <polygon points="15,25 8,22 8,28" fill={skinColor} />
    </svg>
  );
}

function MantaRaySVG({ direction }: { direction: number }) {
  return (
    <svg 
      viewBox="0 0 120 60" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body */}
      <ellipse cx="60" cy="30" rx="20" ry="12" fill="#1E3A5F" />
      {/* Wings */}
      <path 
        d="M40,30 Q20,15 5,25 Q15,30 5,35 Q20,45 40,30" 
        fill="#1E3A5F" 
      />
      <path 
        d="M80,30 Q100,15 115,25 Q105,30 115,35 Q100,45 80,30" 
        fill="#1E3A5F" 
      />
      {/* Belly (lighter) */}
      <ellipse cx="60" cy="32" rx="15" ry="8" fill="#2D5A87" fillOpacity="0.6" />
      {/* Eyes */}
      <circle cx="48" cy="28" r="2" fill="white" fillOpacity="0.8" />
      <circle cx="72" cy="28" r="2" fill="white" fillOpacity="0.8" />
      {/* Tail */}
      <path d="M60,42 Q60,55 55,58" stroke="#1E3A5F" strokeWidth="3" fill="none" />
      {/* Cephalic fins (horn-like) */}
      <path d="M55,22 Q50,15 52,10" stroke="#1E3A5F" strokeWidth="3" fill="none" />
      <path d="M65,22 Q70,15 68,10" stroke="#1E3A5F" strokeWidth="3" fill="none" />
    </svg>
  );
}

function SharkSVG({ direction }: { direction: number }) {
  return (
    <svg 
      viewBox="0 0 100 40" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body - dark silhouette */}
      <ellipse cx="50" cy="20" rx="35" ry="12" fill="#0F172A" fillOpacity="0.8" />
      {/* Head - pointed */}
      <polygon points="85,20 100,18 100,22" fill="#0F172A" fillOpacity="0.8" />
      {/* Dorsal fin */}
      <polygon points="45,8 55,0 60,8" fill="#0F172A" fillOpacity="0.9" />
      {/* Tail */}
      <polygon points="15,20 0,8 5,20 0,32" fill="#0F172A" fillOpacity="0.8" />
      {/* Pectoral fins */}
      <polygon points="55,28 45,38 60,32" fill="#0F172A" fillOpacity="0.7" />
      <g transform="scaleY(-1) translate(0, -40)">
        <polygon points="55,12 45,2 60,8" fill="#0F172A" fillOpacity="0.7" />
      </g>
      {/* Eye - subtle glint */}
      <circle cx="85" cy="18" r="1.5" fill="#334155" />
      {/* Gills */}
      <path d="M70,15 L70,25" stroke="#1E293B" strokeWidth="1" />
      <path d="M73,16 L73,24" stroke="#1E293B" strokeWidth="1" />
      <path d="M76,17 L76,23" stroke="#1E293B" strokeWidth="1" />
    </svg>
  );
}

function AbyssalFishSVG({ glowColor }: { glowColor: string }) {
  return (
    <svg 
      viewBox="0 0 30 20" 
      fill="none" 
      className="h-full w-full"
    >
      {/* Body - dark */}
      <ellipse cx="15" cy="12" rx="10" ry="6" fill="#0A0A0A" />
      {/* Tail */}
      <polygon points="5,12 0,6 0,18" fill="#0A0A0A" />
      {/* Angler light */}
      <circle cx="25" cy="5" r="3" fill={glowColor}>
        <animate 
          attributeName="opacity" 
          values="1;0.3;1" 
          dur="1.5s" 
          repeatCount="indefinite" 
        />
      </circle>
      <path d="M20,8 Q22,5 25,5" stroke="#0A0A0A" strokeWidth="0.5" fill="none" />
      {/* Eye - large for deep sea */}
      <circle cx="20" cy="10" r="3" fill="#111111" />
      <circle cx="21" cy="9" r="1.5" fill={glowColor} fillOpacity="0.5" />
      {/* Teeth */}
      <path d="M24,14 L25,16 L26,14 L27,16" stroke="#FFFFFF" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

function SeaAnemoneSVG({ color, tentacleCount }: { color: string; tentacleCount: number }) {
  const tentacles = Array.from({ length: tentacleCount }, (_, i) => {
    const angle = (i / tentacleCount) * Math.PI - Math.PI / 2;
    const x = 25 + Math.cos(angle) * 15;
    const y = 20;
    const tipX = x + Math.cos(angle) * 20;
    const tipY = 5 + Math.sin(angle) * 5;
    const ctrlX = x + Math.cos(angle) * 10;
    const ctrlY = y - 10;
    return `M${x},${y} Q${ctrlX},${ctrlY} ${tipX},${tipY}`;
  });

  return (
    <svg 
      viewBox="0 0 50 40" 
      fill="none" 
      className="h-full w-full"
    >
      {/* Base */}
      <ellipse cx="25" cy="35" rx="15" ry="5" fill={color} fillOpacity="0.8" />
      {/* Tentacles */}
      {tentacles.map((d, i) => {
        const altPath = d.replace(/Q(\d+\.?\d*),(\d+\.?\d*)/, (_, x, y) => {
          const newX = Number(x) + (i % 2 === 0 ? 3 : -3);
          const newY = Number(y) - 2;
          return `Q${newX},${newY}`;
        });
        
        return (
          <motion.path
            key={i}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ d }}
            animate={{
              d: [d, altPath || d, d],
            }}
            transition={{
              duration: 2 + (i % 3) * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          />
        );
      })}
      {/* Tips with glow */}
      {Array.from({ length: tentacleCount }, (_, i) => {
        const angle = (i / tentacleCount) * Math.PI - Math.PI / 2;
        const tipX = 25 + Math.cos(angle) * 15 + Math.cos(angle) * 20;
        const tipY = 5 + Math.sin(angle) * 5;
        return (
          <circle 
            key={`tip-${i}`} 
            cx={tipX} 
            cy={tipY} 
            r="2" 
            fill="white" 
            fillOpacity="0.6"
          />
        );
      })}
    </svg>
  );
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export function OceanCanvas() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const previousPageIndex = useRef<number>(0);

  // Prevent hydration mismatch by delaying scroll-based updates
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    setScrollProgress(Math.min(1, Math.max(0, progress)));
  }, []);

  // Camera position from pathname
  const currentPageIndex = useMemo(() => getPageIndex(pathname), [pathname]);
  const cameraX = currentPageIndex * -50;
  
  // Update ref in separate effect
  useEffect(() => {
    previousPageIndex.current = currentPageIndex;
  }, [currentPageIndex]);

  // Reset scroll on page change
  useEffect(() => {
    const currentIdx = getPageIndex(pathname);
    const direction = currentIdx - previousPageIndex.current;
    
    if (direction !== 0) {
      const scrollTimer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [pathname]);

  // Generate all marine life with useMemo for SSR compatibility
  const particles = useMemo(() => generateParticles(100), []);
  const jellyfish = useMemo(() => generateJellyfish(10), []);
  const fish = useMemo(() => generateFish(12), []);
  
  // Surface zone
  const tropicalFish = useMemo(() => generateTropicalFish(20), []);
  const bubbles = useMemo(() => generateBubbles(25), []);
  
  // Middle zone
  const seaTurtles = useMemo(() => generateSeaTurtles(3), []);
  const mantaRays = useMemo(() => generateMantaRays(2), []);
  
  // Deep zone
  const sharks = useMemo(() => generateSharks(4), []);
  const abyssalFish = useMemo(() => generateAbyssalFish(15), []);
  const marineSnow = useMemo(() => generateMarineSnow(50), []);
  const seaAnemones = useMemo(() => generateSeaAnemones(6), []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    requestAnimationFrame(() => {
      handleScroll();
    });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Use 0 as base until mounted to prevent hydration mismatch (flash of different colors)
  const effectiveScrollProgress = isMounted ? scrollProgress : 0;
  
  const depth = Math.round(effectiveScrollProgress * 40);

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-50" aria-hidden="true">
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0b3a4a 0%, #075985 35%, #0b2a3c 65%, #020617 100%)",
          }}
        />
      </div>
    );
  }

  // Color interpolation based on scroll (darker, less saturated than before)
  
  const topHue = 190;
  const bottomHue = 220;
  const currentHue = topHue + (bottomHue - topHue) * effectiveScrollProgress;
  
  const topSat = 50;
  const bottomSat = 35;
  const currentSat = topSat - (topSat - bottomSat) * effectiveScrollProgress;
  
  const topLight = 28;
  const bottomLight = 6;
  const currentLight = topLight - (topLight - bottomLight) * effectiveScrollProgress;

  // Visibility by depth zone (use effective scroll progress for consistency)
  const surfaceVisibility = Math.max(0, 1 - effectiveScrollProgress * 4); // 0-25%
  const middleVisibility = effectiveScrollProgress > 0.1 && effectiveScrollProgress < 0.6 
    ? Math.min(1, Math.min((effectiveScrollProgress - 0.1) * 4, (0.6 - effectiveScrollProgress) * 4)) 
    : 0;
  const deepVisibility = effectiveScrollProgress > 0.4 
    ? Math.min(1, (effectiveScrollProgress - 0.4) * 2) 
    : 0;

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden" aria-hidden="true">
      {/* Camera container with horizontal movement */}
      <motion.div
        className="absolute inset-0"
        style={{ width: "500vw", height: "100%" }}
        animate={{ x: cameraX + "vw" }}
        transition={{
          type: "spring",
          stiffness: 30,
          damping: 25,
          mass: 1.2,
        }}
      >
        {/* Main background gradient - Fixed with scroll progress adjusting view */}
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            background: `linear-gradient(180deg, 
              hsl(${currentHue - 8}, ${currentSat + 8}%, ${currentLight + 8}%) 0%,
              hsl(${currentHue - 3}, ${currentSat + 5}%, ${currentLight + 4}%) 25%,
              hsl(${currentHue + 4}, ${currentSat}%, ${currentLight}%) 50%,
              hsl(${currentHue + 10}, ${Math.max(20, currentSat - 6)}%, ${Math.max(5, currentLight - 4)}%) 75%,
              hsl(${currentHue + 14}, ${Math.max(18, currentSat - 10)}%, ${Math.max(3, currentLight - 8)}%) 100%
            )`,
          }}
        />

        {/* Sun rays - more intense near surface */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: Math.max(0, 1 - effectiveScrollProgress * 1.5),
            background: `
              radial-gradient(ellipse 25% 120% at 10% 0%, rgba(255,255,255,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 20% 100% at 30% 0%, rgba(255,255,255,0.14) 0%, transparent 55%),
              radial-gradient(ellipse 22% 110% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 50%),
              radial-gradient(ellipse 18% 90% at 70% 0%, rgba(255,255,255,0.12) 0%, transparent 55%),
              radial-gradient(ellipse 15% 80% at 90% 0%, rgba(255,255,255,0.10) 0%, transparent 50%)
            `,
          }}
        />

        {/* ========================================= */}
        {/* SURFACE ZONE (0-15%) - Tropical life */}
        {/* ========================================= */}

        {/* Rising bubbles */}
        {bubbles.map((b) => (
          <motion.div
            key={`bubble-${b.id}`}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2))",
              border: "1px solid rgba(255,255,255,0.3)",
              opacity: surfaceVisibility * 0.6,
            }}
            animate={{
              y: ["100vh", "-10vh"],
              x: [0, (b.id % 2 === 0 ? 20 : -20), 0],
            }}
            transition={{
              y: { duration: b.duration, repeat: Infinity, ease: "linear", delay: b.delay },
              x: { duration: b.duration / 2, repeat: Infinity, ease: "easeInOut", delay: b.delay },
            }}
          />
        ))}

        {/* Tropical fish schools */}
        {tropicalFish.map((tf) => {
          if (surfaceVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`tropical-${tf.id}`}
              className="absolute"
              style={{
                top: `${tf.y}%`,
                width: tf.size,
                height: tf.size * 0.6,
                opacity: surfaceVisibility * 0.9,
              }}
              animate={{
                x: tf.direction === 1 ? ["-10vw", "110vw"] : ["110vw", "-10vw"],
                y: [0, -10 - tf.schoolOffset, 0, 10 + tf.schoolOffset, 0],
              }}
              transition={{
                x: { duration: tf.speed, repeat: Infinity, ease: "linear", delay: tf.schoolOffset },
                y: { duration: 3 + tf.schoolOffset * 0.2, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <TropicalFishSVG color={tf.color} finColor={tf.finColor} direction={tf.direction} />
            </motion.div>
          );
        })}

        {/* ========================================= */}
        {/* MIDDLE ZONE (15-50%) - Large creatures */}
        {/* ========================================= */}

        {/* Bioluminescent particles */}
        {particles.map((p) => {
          const parallaxY = p.y - effectiveScrollProgress * 30;
          const visibility = parallaxY > -10 && parallaxY < 110 ? p.opacity : 0;
          
          return (
            <motion.div
              key={`particle-${p.id}`}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${parallaxY}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.size}px ${p.color}50`,
                opacity: visibility,
              }}
              animate={{
                opacity: [visibility, visibility * 0.3, visibility],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Jellyfish */}
        {jellyfish.map((jelly) => {
          const parallaxY = jelly.y - effectiveScrollProgress * 50;
          const jellyOpacity = parallaxY > -30 && parallaxY < 130 ? middleVisibility + 0.3 : 0;
          
          if (jellyOpacity <= 0) return null;
          
          return (
            <motion.div
              key={`jelly-${jelly.id}`}
              className="absolute"
              style={{
                left: `${jelly.x}%`,
                top: `${parallaxY}%`,
                width: jelly.size,
                height: jelly.size * 1.5,
                opacity: jellyOpacity,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 6, -3, 0],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 6,
                delay: jelly.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg 
                viewBox="0 0 100 150" 
                fill="none" 
                className="h-full w-full"
                style={{ filter: `drop-shadow(0 0 20px ${jelly.glowColor}80)` }}
              >
                <motion.ellipse
                  cx="50" cy="35"
                  fill={jelly.color} fillOpacity="0.4"
                  stroke={jelly.color} strokeWidth="1.5" strokeOpacity="0.8"
                  initial={{ rx: 42, ry: 35 }}
                  animate={{ rx: [42, 38, 42], ry: [35, 30, 35] }}
                  transition={{ duration: 2, delay: jelly.delay, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.ellipse
                  cx="50" cy="28" ry={20}
                  fill={jelly.glowColor} fillOpacity="0.3"
                  initial={{ rx: 28 }}
                  animate={{ fillOpacity: [0.25, 0.5, 0.25], rx: [28, 24, 28] }}
                  transition={{ duration: 2.5, delay: jelly.delay + 0.2, repeat: Infinity, ease: "easeInOut" }}
                />
                {[15, 30, 50, 70, 85].map((x, i) => {
                  const basePath = `M${x},68 Q${x + (i % 2 === 0 ? 10 : -10)},100 ${x},130 Q${x + (i % 2 === 0 ? -6 : 6)},142 ${x + (i % 2 === 0 ? -4 : 4)},150`;
                  const altPath1 = `M${x},68 Q${x + (i % 2 === 0 ? -8 : 8)},95 ${x + 4},125 Q${x + (i % 2 === 0 ? 8 : -8)},140 ${x + (i % 2 === 0 ? 5 : -5)},150`;
                  
                  return (
                    <motion.path
                      key={`t-${i}`}
                      stroke={jelly.color} strokeWidth="2" strokeOpacity="0.7" fill="none" strokeLinecap="round"
                      initial={{ d: basePath }}
                      animate={{
                        d: [basePath, altPath1, basePath],
                      }}
                      transition={{ duration: 3, delay: jelly.delay + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  );
                })}
                <circle cx="35" cy="30" r="3" fill={jelly.glowColor} fillOpacity="0.6" />
                <circle cx="50" cy="35" r="4" fill={jelly.glowColor} fillOpacity="0.7" />
                <circle cx="65" cy="30" r="3" fill={jelly.glowColor} fillOpacity="0.6" />
              </svg>
            </motion.div>
          );
        })}

        {/* Sea Turtles */}
        {seaTurtles.map((turtle) => {
          if (middleVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`turtle-${turtle.id}`}
              className="absolute"
              style={{
                top: `${turtle.y}%`,
                width: turtle.size,
                height: turtle.size * 0.625,
                opacity: middleVisibility * 0.85,
              }}
              animate={{
                x: turtle.direction === 1 ? ["-15vw", "115vw"] : ["115vw", "-15vw"],
                y: [0, -15, 0, 15, 0],
                rotate: [0, turtle.direction * 5, 0, turtle.direction * -5, 0],
              }}
              transition={{
                x: { duration: turtle.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <SeaTurtleSVG color={turtle.color} direction={turtle.direction} />
            </motion.div>
          );
        })}

        {/* Manta Rays */}
        {mantaRays.map((manta) => {
          if (middleVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`manta-${manta.id}`}
              className="absolute"
              style={{
                top: `${manta.y}%`,
                width: manta.size,
                height: manta.size * 0.5,
                opacity: middleVisibility * 0.7,
              }}
              animate={{
                x: manta.direction === 1 ? ["-20vw", "120vw"] : ["120vw", "-20vw"],
                y: [0, -30, 0],
                scaleX: [1, 1.1, 1, 0.9, 1],
              }}
              transition={{
                x: { duration: manta.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                scaleX: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <MantaRaySVG direction={manta.direction} />
            </motion.div>
          );
        })}

        {/* ========================================= */}
        {/* DEEP ZONE (50-100%) - Dark creatures */}
        {/* ========================================= */}

        {/* Marine Snow */}
        {marineSnow.map((snow) => {
          if (deepVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`snow-${snow.id}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${snow.x}%`,
                width: snow.size,
                height: snow.size,
                opacity: deepVisibility * 0.4,
              }}
              animate={{
                y: ["-10vh", "110vh"],
                x: [0, 10, -10, 0],
              }}
              transition={{
                y: { duration: snow.duration, repeat: Infinity, ease: "linear", delay: snow.delay },
                x: { duration: snow.duration / 3, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          );
        })}

        {/* Deep fish (from original) */}
        {fish.map((f) => {
          const fishOpacity = effectiveScrollProgress > 0.25 ? Math.min(0.7, (effectiveScrollProgress - 0.25) * 1.5) : 0;
          
          if (fishOpacity <= 0) return null;
          
          return (
            <motion.div
              key={`fish-${f.id}`}
              className="absolute"
              style={{
                top: `${f.y}%`,
                width: f.size,
                height: f.size * 0.5,
                opacity: fishOpacity,
              }}
              animate={{
                x: f.direction === 1 ? ["-10vw", "110vw"] : ["110vw", "-10vw"],
              }}
              transition={{
                duration: f.speed,
                repeat: Infinity,
                ease: "linear",
                delay: seededRandom(f.id) * f.speed,
              }}
            >
              <svg 
                viewBox="0 0 40 20" 
                fill="none" 
                className="h-full w-full"
                style={{ transform: f.direction === -1 ? "scaleX(-1)" : "none" }}
              >
                <ellipse cx="18" cy="10" rx="14" ry="8" fill={f.color} fillOpacity="0.7" />
                <polygon points="32,10 40,2 40,18" fill={f.color} fillOpacity="0.6" />
                <circle cx="10" cy="8" r="2" fill="#000" fillOpacity="0.4" />
              </svg>
            </motion.div>
          );
        })}

        {/* Sharks - dark silhouettes */}
        {sharks.map((shark) => {
          if (deepVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`shark-${shark.id}`}
              className="absolute"
              style={{
                top: `${shark.y}%`,
                width: shark.size,
                height: shark.size * 0.4,
                opacity: deepVisibility * 0.6,
              }}
              animate={{
                x: shark.direction === 1 ? ["-20vw", "120vw"] : ["120vw", "-20vw"],
                y: [0, -10, 0, 10, 0],
              }}
              transition={{
                x: { duration: shark.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <SharkSVG direction={shark.direction} />
            </motion.div>
          );
        })}

        {/* Abyssal fish with bioluminescence */}
        {abyssalFish.map((af) => {
          const parallaxY = af.y - effectiveScrollProgress * 20;
          
          if (deepVisibility <= 0 || parallaxY < 50) return null;
          
          return (
            <motion.div
              key={`abyssal-${af.id}`}
              className="absolute"
              style={{
                left: `${af.x}%`,
                top: `${parallaxY}%`,
                width: af.size,
                height: af.size * 0.66,
                opacity: deepVisibility * 0.8,
                filter: `drop-shadow(0 0 ${af.size}px ${af.glowColor})`,
              }}
              animate={{
                x: [0, 20, -20, 0],
                y: [0, -10, 10, 0],
                scale: [1, 1.05, 0.95, 1],
              }}
              transition={{
                duration: af.duration * 2,
                delay: af.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <AbyssalFishSVG glowColor={af.glowColor} />
            </motion.div>
          );
        })}

        {/* Sea Anemones on the sides */}
        {seaAnemones.map((anemone) => {
          if (deepVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`anemone-${anemone.id}`}
              className="absolute"
              style={{
                left: `${anemone.x}%`,
                top: `${anemone.y}%`,
                width: anemone.size,
                height: anemone.size,
                opacity: deepVisibility * 0.7,
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SeaAnemoneSVG color={anemone.color} tentacleCount={anemone.tentacleCount} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Depth gauge - stays fixed */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
        <span className="text-sm font-mono text-white/60 tabular-nums">{depth}</span>
        <span className="text-xs text-white/50">m</span>
        <div className="h-24 w-px bg-gradient-to-b from-white/40 via-white/25 to-white/10 my-2" />
        <svg className="h-5 w-5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </div>

      {/* Vignette - stronger at depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 100%)",
          opacity: 0.3 + effectiveScrollProgress * 0.5,
        }}
      />
    </div>
  );
}
