"use client";

import { useEffect, useState, useCallback, useRef, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Code, Globe, Cloud, Laptop, Bot } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";

// Hydration-safe mounting check using useSyncExternalStore
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Ocean Background - Enhanced Marine Life Edition v2
 * 
 * REALISTIC DEPTH ZONES (based on actual ocean zones):
 * 
 * 🌅 SUNLIGHT ZONE / Epipelagic (0-20% scroll)
 *    - Tropical fish, clownfish, seahorses
 *    - Sea turtles, manta rays (upper part)
 *    - Corals, anemones (need photosynthesis)
 *    - Bubbles, intense sun rays
 * 
 * 🌊 TWILIGHT ZONE / Mesopelagic (15-45% scroll)
 *    - Dolphins, small sharks, schools of fish
 *    - Sea turtles, manta rays (diving)
 *    - Jellyfish begin appearing
 *    - Light fades rapidly
 * 
 * 🌑 MIDNIGHT ZONE / Bathypelagic (35-65% scroll)
 *    - Whales, large sharks
 *    - Bioluminescent jellyfish peak
 *    - Octopuses, silhouette fish
 *    - No sunlight penetrates
 * 
 * 👁️ ABYSSAL ZONE / Abyssopelagic (50-85% scroll)
 *    - Giant squids, deep octopuses
 *    - Anglerfish with bioluminescence
 *    - Marine snow increases
 *    - Sparse life, cold darkness
 * 
 * ⚫ HADAL ZONE / Hadopelagic (75-100% scroll)
 *    - Only specialized bioluminescent creatures
 *    - Maximum marine snow
 *    - Extreme pressure, near-total darkness
 *    - Very sparse life
 * 
 * CAMERA MOVEMENT:
 * - Pages ordered left to right according to navbar
 * - Navigate right → camera moves right
 * - Navigate left → camera moves left
 * - Page change → automatic rise to surface
 */

// Page order in navbar (left to right) - updated for v2 without locale prefix
const PAGE_ORDER = [
  "", // home (/)
  "about",
  "explorer", 
  "centers",
  "contact",
];

function getPageIndex(pathname: string): number {
  // Remove leading slash and get first segment
  const segments = pathname.split("/").filter(Boolean);
  const pageSegment = segments[0] || "";
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

type SeahorseData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  direction: number;
};

type ClownfishData = {
  id: number;
  x: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
  anemoneOffset: number;
};

type DolphinData = {
  id: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
  podOffset: number;
};

type WhaleData = {
  id: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
  type: "humpback" | "orca";
};

type OctopusData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
};

type GiantSquidData = {
  id: number;
  y: number;
  size: number;
  direction: number;
  speed: number;
  glowColor: string;
};

type CoralData = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  type: "brain" | "fan" | "staghorn";
  side: "left" | "right";
};

type SchoolFishData = {
  id: number;
  y: number;
  size: number;
  color: string;
  fishCount: number;
  direction: number;
  speed: number;
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

// New marine life generators

function generateSeahorses(count: number): SeahorseData[] {
  const seahorseColors = ["#FFD700", "#FFA500", "#FF6347", "#9370DB", "#20B2AA"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 10 + seededRandom(i * 5 + 1) * 80,
    y: 8 + seededRandom(i * 5 + 2) * 10, // Surface zone 8-18%
    size: 25 + seededRandom(i * 5 + 3) * 20,
    color: seahorseColors[i % seahorseColors.length] ?? "#FFD700",
    direction: seededRandom(i * 5 + 4) > 0.5 ? 1 : -1,
  }));
}

function generateClownfish(count: number): ClownfishData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + seededRandom(i * 4 + 1) * 90,
    y: 5 + seededRandom(i * 4 + 2) * 12, // Surface zone
    size: 12 + seededRandom(i * 4 + 3) * 10,
    direction: seededRandom(i * 4 + 4) > 0.5 ? 1 : -1,
    speed: 6 + seededRandom(i * 4 + 5) * 4,
    anemoneOffset: seededRandom(i * 4 + 6) * 3,
  }));
}

function generateDolphins(count: number): DolphinData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 20 + seededRandom(i * 5 + 1) * 15, // Middle zone 20-35%
    size: 80 + seededRandom(i * 5 + 2) * 40,
    direction: seededRandom(i * 5 + 3) > 0.5 ? 1 : -1,
    speed: 12 + seededRandom(i * 5 + 4) * 8,
    podOffset: (i % 3) * 2 + seededRandom(i * 5 + 5) * 2,
  }));
}

function generateWhales(count: number): WhaleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 35 + seededRandom(i * 4 + 1) * 20, // Middle-deep zone 35-55%
    size: 200 + seededRandom(i * 4 + 2) * 100,
    direction: seededRandom(i * 4 + 3) > 0.5 ? 1 : -1,
    speed: 35 + seededRandom(i * 4 + 4) * 15, // Slow and majestic
    type: i % 2 === 0 ? "humpback" : "orca",
  }));
}

function generateOctopuses(count: number): OctopusData[] {
  const octopusColors = ["#8B4513", "#CD853F", "#A0522D", "#D2691E", "#8B0000"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: i % 2 === 0 ? 5 + seededRandom(i * 4 + 1) * 15 : 80 + seededRandom(i * 4 + 1) * 15,
    y: 65 + seededRandom(i * 4 + 2) * 25, // Deep zone 65-90%
    size: 50 + seededRandom(i * 4 + 3) * 40,
    color: octopusColors[i % octopusColors.length] ?? "#8B4513",
  }));
}

function generateGiantSquids(count: number): GiantSquidData[] {
  const glowColors = ["#FF1493", "#00CED1", "#7B68EE", "#DC143C"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 70 + seededRandom(i * 5 + 1) * 20, // Deep zone 70-90%
    size: 120 + seededRandom(i * 5 + 2) * 60,
    direction: seededRandom(i * 5 + 3) > 0.5 ? 1 : -1,
    speed: 25 + seededRandom(i * 5 + 4) * 10,
    glowColor: glowColors[i % glowColors.length] ?? "#FF1493",
  }));
}

function generateCorals(count: number): CoralData[] {
  const coralColors = ["#FF7F50", "#FF6B6B", "#FFB347", "#87CEEB", "#DDA0DD", "#98D8C8"];
  const coralTypes: ("brain" | "fan" | "staghorn")[] = ["brain", "fan", "staghorn"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: i % 2 === 0 ? seededRandom(i * 5 + 1) * 12 : 88 + seededRandom(i * 5 + 1) * 12,
    y: 80 + seededRandom(i * 5 + 2) * 18, // Bottom zone 80-98%
    size: 30 + seededRandom(i * 5 + 3) * 40,
    color: coralColors[i % coralColors.length] ?? "#FF7F50",
    type: coralTypes[i % coralTypes.length] ?? "brain",
    side: i % 2 === 0 ? "left" : "right",
  }));
}

function generateSchoolFish(count: number): SchoolFishData[] {
  const schoolColors = ["#C0C0C0", "#87CEEB", "#B0E0E6", "#ADD8E6"];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    y: 15 + seededRandom(i * 5 + 1) * 35, // 15-50%
    size: 4 + seededRandom(i * 5 + 2) * 4,
    color: schoolColors[i % schoolColors.length] ?? "#C0C0C0",
    fishCount: 15 + Math.floor(seededRandom(i * 5 + 3) * 25),
    direction: seededRandom(i * 5 + 4) > 0.5 ? 1 : -1,
    speed: 10 + seededRandom(i * 5 + 5) * 8,
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
      style={{ transform: direction === 1 ? "scaleX(-1)" : "none" }}
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

function SeahorseSVG({ color, direction }: { color: string; direction: number }) {
  return (
    <svg 
      viewBox="0 0 40 60" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Head */}
      <ellipse cx="22" cy="10" rx="8" ry="6" fill={color} />
      {/* Snout */}
      <ellipse cx="32" cy="12" rx="6" ry="3" fill={color} />
      {/* Eye */}
      <circle cx="20" cy="9" r="2" fill="black" />
      <circle cx="19" cy="8" r="0.8" fill="white" />
      {/* Crown/Coronet */}
      <path d="M18,4 L20,0 L22,4 L24,1 L26,5" stroke={color} strokeWidth="2" fill="none" />
      {/* Body - curved */}
      <path 
        d="M20,16 Q25,25 22,35 Q18,45 20,55" 
        stroke={color} 
        strokeWidth="8" 
        fill="none"
        strokeLinecap="round"
      />
      {/* Belly segments */}
      <path d="M16,20 Q14,25 16,30" stroke={color} strokeWidth="6" fill="none" strokeOpacity="0.7" />
      <path d="M15,32 Q13,38 16,44" stroke={color} strokeWidth="5" fill="none" strokeOpacity="0.6" />
      {/* Tail curl */}
      <path 
        d="M20,55 Q25,58 22,62 Q18,65 15,60 Q12,55 16,52" 
        stroke={color} 
        strokeWidth="3" 
        fill="none"
        strokeLinecap="round"
      />
      {/* Dorsal fin */}
      <path d="M26,22 Q32,25 28,30 Q26,28 26,22" fill={color} fillOpacity="0.6" />
      {/* Pectoral fin */}
      <ellipse cx="15" cy="18" rx="4" ry="2" fill={color} fillOpacity="0.5" />
    </svg>
  );
}

function ClownfishSVG({ direction }: { direction: number }) {
  return (
    <svg 
      viewBox="0 0 40 25" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === 1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body - orange */}
      <ellipse cx="18" cy="12" rx="14" ry="9" fill="#FF6600" />
      {/* White stripes */}
      <path d="M8,3 Q10,12 8,21" stroke="white" strokeWidth="3" fill="none" />
      <path d="M18,4 Q20,12 18,20" stroke="white" strokeWidth="3" fill="none" />
      <path d="M28,6 Q30,12 28,18" stroke="white" strokeWidth="2" fill="none" />
      {/* Black outlines on stripes */}
      <path d="M6,4 Q8,12 6,20" stroke="black" strokeWidth="0.5" fill="none" />
      <path d="M10,3 Q12,12 10,21" stroke="black" strokeWidth="0.5" fill="none" />
      <path d="M16,4 Q18,12 16,20" stroke="black" strokeWidth="0.5" fill="none" />
      <path d="M20,4 Q22,12 20,20" stroke="black" strokeWidth="0.5" fill="none" />
      {/* Tail */}
      <polygon points="32,12 40,5 40,19" fill="#FF6600" />
      <path d="M36,6 L36,18" stroke="white" strokeWidth="1.5" />
      {/* Dorsal fin */}
      <path d="M12,3 Q18,0 24,3" fill="#FF6600" />
      {/* Eye */}
      <circle cx="8" cy="10" r="3" fill="white" />
      <circle cx="7" cy="10" r="1.5" fill="black" />
      {/* Pectoral fin */}
      <ellipse cx="14" cy="16" rx="4" ry="2" fill="#FF6600" fillOpacity="0.8" />
    </svg>
  );
}

function DolphinSVG({ direction }: { direction: number }) {
  return (
    <svg 
      viewBox="0 0 100 40" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body - streamlined */}
      <ellipse cx="50" cy="20" rx="38" ry="12" fill="#708090" />
      {/* Belly - lighter */}
      <ellipse cx="50" cy="24" rx="30" ry="8" fill="#B8C6D6" fillOpacity="0.8" />
      {/* Head/Snout - elongated beak */}
      <path d="M88,20 Q95,18 100,20 Q95,22 88,20" fill="#708090" />
      {/* Dorsal fin - curved */}
      <path d="M45,8 Q52,0 55,8 L50,10 Z" fill="#5A6B7A" />
      {/* Tail flukes */}
      <path d="M12,20 Q5,12 0,15 Q8,20 0,25 Q5,28 12,20" fill="#5A6B7A" />
      {/* Pectoral fin */}
      <path d="M60,26 Q55,35 48,32 Q52,28 60,26" fill="#5A6B7A" />
      {/* Eye */}
      <circle cx="82" cy="18" r="2.5" fill="#1A1A2E" />
      <circle cx="83" cy="17" r="0.8" fill="white" fillOpacity="0.6" />
      {/* Blowhole */}
      <ellipse cx="70" cy="12" rx="2" ry="1" fill="#5A6B7A" />
      {/* Smile line */}
      <path d="M88,22 Q92,24 95,22" stroke="#5A6B7A" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

function WhaleSVG({ direction, type }: { direction: number; type: "humpback" | "orca" }) {
  if (type === "orca") {
    return (
      <svg 
        viewBox="0 0 150 50" 
        fill="none" 
        className="h-full w-full"
        style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
      >
        {/* Body - black */}
        <ellipse cx="75" cy="28" rx="55" ry="18" fill="#0A0A0A" />
        {/* White patch behind eye */}
        <ellipse cx="115" cy="22" rx="8" ry="5" fill="white" />
        {/* White belly/saddle */}
        <ellipse cx="75" cy="38" rx="35" ry="10" fill="white" fillOpacity="0.9" />
        {/* Dorsal fin - tall */}
        <path d="M65,10 Q72,-5 78,10 L72,12 Z" fill="#0A0A0A" />
        {/* Tail flukes */}
        <path d="M20,28 Q8,18 0,22 Q12,28 0,34 Q8,38 20,28" fill="#0A0A0A" />
        {/* Pectoral fin */}
        <ellipse cx="95" cy="38" rx="15" ry="5" fill="#0A0A0A" transform="rotate(-20 95 38)" />
        {/* Eye */}
        <circle cx="120" cy="24" r="2" fill="#1A1A2E" />
        {/* Snout */}
        <ellipse cx="135" cy="28" rx="10" ry="8" fill="#0A0A0A" />
      </svg>
    );
  }
  
  // Humpback whale
  return (
    <svg 
      viewBox="0 0 150 60" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: direction === -1 ? "scaleX(-1)" : "none" }}
    >
      {/* Body - dark blue-grey */}
      <ellipse cx="75" cy="32" rx="55" ry="22" fill="#2F4F4F" />
      {/* Belly - lighter, grooved */}
      <ellipse cx="75" cy="42" rx="40" ry="14" fill="#5F7F7F" fillOpacity="0.7" />
      {/* Throat grooves */}
      <path d="M50,38 L100,38" stroke="#3F5F5F" strokeWidth="0.5" />
      <path d="M55,42 L95,42" stroke="#3F5F5F" strokeWidth="0.5" />
      <path d="M60,46 L90,46" stroke="#3F5F5F" strokeWidth="0.5" />
      {/* Dorsal fin - small hump */}
      <path d="M55,12 Q60,8 65,12" fill="#2F4F4F" />
      {/* Tail flukes - large and distinctive */}
      <path d="M20,32 Q5,18 0,25 Q15,32 0,40 Q5,48 20,32" fill="#2F4F4F" />
      {/* Long pectoral fin */}
      <path d="M95,42 Q85,58 70,55 Q80,48 95,42" fill="#4F6F6F" />
      {/* Head bumps (tubercles) */}
      <circle cx="130" cy="28" r="2" fill="#3F5F5F" />
      <circle cx="135" cy="32" r="2" fill="#3F5F5F" />
      <circle cx="138" cy="36" r="1.5" fill="#3F5F5F" />
      {/* Eye */}
      <circle cx="125" cy="30" r="2.5" fill="#1A1A2E" />
      {/* Blowhole */}
      <ellipse cx="115" cy="15" rx="4" ry="2" fill="#3F5F5F" />
    </svg>
  );
}

function OctopusSVG({ color }: { color: string }) {
  const tentaclePositions = [
    { startX: 25, startY: 35, endX: 5, endY: 55 },
    { startX: 30, startY: 38, endX: 15, endY: 60 },
    { startX: 35, startY: 40, endX: 30, endY: 62 },
    { startX: 40, startY: 40, endX: 45, endY: 62 },
    { startX: 45, startY: 38, endX: 55, endY: 60 },
    { startX: 50, startY: 35, endX: 65, endY: 55 },
    { startX: 55, startY: 32, endX: 70, endY: 48 },
    { startX: 20, startY: 32, endX: 2, endY: 48 },
  ];

  return (
    <svg 
      viewBox="0 0 70 65" 
      fill="none" 
      className="h-full w-full"
    >
      {/* Head/Mantle */}
      <ellipse cx="37" cy="20" rx="18" ry="16" fill={color} />
      {/* Eyes */}
      <ellipse cx="30" cy="22" rx="5" ry="6" fill="#FFF8DC" />
      <ellipse cx="44" cy="22" rx="5" ry="6" fill="#FFF8DC" />
      <circle cx="30" cy="23" r="3" fill="black" />
      <circle cx="44" cy="23" r="3" fill="black" />
      <circle cx="29" cy="22" r="1" fill="white" />
      <circle cx="43" cy="22" r="1" fill="white" />
      {/* Tentacles */}
      {tentaclePositions.map((t, i) => (
        <motion.path
          key={i}
          d={`M${t.startX},${t.startY} Q${(t.startX + t.endX) / 2 + (i % 2 === 0 ? 5 : -5)},${(t.startY + t.endY) / 2} ${t.endX},${t.endY}`}
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ d: `M${t.startX},${t.startY} Q${(t.startX + t.endX) / 2 + (i % 2 === 0 ? 5 : -5)},${(t.startY + t.endY) / 2} ${t.endX},${t.endY}` }}
          animate={{
            d: [
              `M${t.startX},${t.startY} Q${(t.startX + t.endX) / 2 + (i % 2 === 0 ? 5 : -5)},${(t.startY + t.endY) / 2} ${t.endX},${t.endY}`,
              `M${t.startX},${t.startY} Q${(t.startX + t.endX) / 2 + (i % 2 === 0 ? -8 : 8)},${(t.startY + t.endY) / 2 + 5} ${t.endX + (i % 2 === 0 ? -5 : 5)},${t.endY}`,
              `M${t.startX},${t.startY} Q${(t.startX + t.endX) / 2 + (i % 2 === 0 ? 5 : -5)},${(t.startY + t.endY) / 2} ${t.endX},${t.endY}`,
            ],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
      {/* Suckers indication */}
      {tentaclePositions.slice(0, 4).map((t, i) => (
        <circle 
          key={`sucker-${i}`} 
          cx={(t.startX + t.endX) / 2} 
          cy={(t.startY + t.endY) / 2 + 3} 
          r="1.5" 
          fill={color} 
          fillOpacity="0.5"
        />
      ))}
    </svg>
  );
}

function GiantSquidSVG({ direction, glowColor }: { direction: number; glowColor: string }) {
  return (
    <svg 
      viewBox="0 0 120 50" 
      fill="none" 
      className="h-full w-full"
      style={{ 
        transform: direction === -1 ? "scaleX(-1)" : "none",
        filter: `drop-shadow(0 0 10px ${glowColor}40)`,
      }}
    >
      {/* Mantle */}
      <ellipse cx="30" cy="25" rx="25" ry="15" fill="#4A0E0E" />
      {/* Fins */}
      <path d="M5,25 Q0,15 10,10 Q15,20 5,25 Q15,30 10,40 Q0,35 5,25" fill="#5A1E1E" />
      {/* Head */}
      <ellipse cx="60" cy="25" rx="12" ry="10" fill="#4A0E0E" />
      {/* Eyes - large */}
      <ellipse cx="62" cy="20" rx="5" ry="6" fill="#000" />
      <ellipse cx="62" cy="30" rx="5" ry="6" fill="#000" />
      <circle cx="63" cy="20" r="2" fill={glowColor} fillOpacity="0.8" />
      <circle cx="63" cy="30" r="2" fill={glowColor} fillOpacity="0.8" />
      {/* Arms */}
      {[18, 22, 25, 28, 32].map((y, i) => (
        <motion.path
          key={`arm-${i}`}
          stroke="#3A0808"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={{ d: `M72,${y} Q90,${y + (i % 2 === 0 ? 3 : -3)} 105,${y}` }}
          animate={{
            d: [
              `M72,${y} Q90,${y + (i % 2 === 0 ? 3 : -3)} 105,${y}`,
              `M72,${y} Q88,${y + (i % 2 === 0 ? -4 : 4)} 108,${y + (i % 2 === 0 ? 2 : -2)}`,
              `M72,${y} Q90,${y + (i % 2 === 0 ? 3 : -3)} 105,${y}`,
            ],
          }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
      {/* Two long tentacles */}
      <motion.path
        stroke="#3A0808"
        strokeWidth="1.5"
        fill="none"
        initial={{ d: "M72,23 Q95,15 115,20 Q118,22 120,20" }}
        animate={{
          d: [
            "M72,23 Q95,15 115,20 Q118,22 120,20",
            "M72,23 Q92,10 115,15 Q120,18 118,22",
            "M72,23 Q95,15 115,20 Q118,22 120,20",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        stroke="#3A0808"
        strokeWidth="1.5"
        fill="none"
        initial={{ d: "M72,27 Q95,35 115,30 Q118,28 120,30" }}
        animate={{
          d: [
            "M72,27 Q95,35 115,30 Q118,28 120,30",
            "M72,27 Q92,40 115,35 Q120,32 118,28",
            "M72,27 Q95,35 115,30 Q118,28 120,30",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      {/* Bioluminescent spots */}
      <circle cx="25" cy="20" r="2" fill={glowColor} fillOpacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="35" cy="30" r="1.5" fill={glowColor} fillOpacity="0.5">
        <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="28" r="1" fill={glowColor} fillOpacity="0.4">
        <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function CoralSVG({ color, type }: { color: string; type: "brain" | "fan" | "staghorn" }) {
  if (type === "brain") {
    return (
      <svg viewBox="0 0 50 40" fill="none" className="h-full w-full">
        <ellipse cx="25" cy="25" rx="20" ry="14" fill={color} />
        <path d="M10,22 Q15,18 20,22 Q25,26 30,22 Q35,18 40,22" stroke={color} strokeWidth="2" fill="none" style={{ filter: "brightness(0.8)" }} />
        <path d="M12,28 Q17,24 22,28 Q27,32 32,28 Q37,24 42,28" stroke={color} strokeWidth="2" fill="none" style={{ filter: "brightness(0.8)" }} />
        <ellipse cx="25" cy="25" rx="16" ry="10" fill="none" stroke={color} strokeWidth="1" style={{ filter: "brightness(1.2)" }} />
      </svg>
    );
  }
  
  if (type === "fan") {
    return (
      <svg viewBox="0 0 50 50" fill="none" className="h-full w-full">
        <path d="M25,48 L25,35" stroke={color} strokeWidth="3" style={{ filter: "brightness(0.7)" }} />
        <path 
          d="M25,35 Q5,25 10,5 Q15,10 20,5 Q25,0 30,5 Q35,10 40,5 Q45,25 25,35" 
          fill={color} 
          fillOpacity="0.8"
        />
        {/* Fan ribs */}
        <path d="M25,35 Q15,20 12,8" stroke={color} strokeWidth="0.5" fill="none" style={{ filter: "brightness(0.8)" }} />
        <path d="M25,35 Q20,18 18,5" stroke={color} strokeWidth="0.5" fill="none" style={{ filter: "brightness(0.8)" }} />
        <path d="M25,35 L25,5" stroke={color} strokeWidth="0.5" fill="none" style={{ filter: "brightness(0.8)" }} />
        <path d="M25,35 Q30,18 32,5" stroke={color} strokeWidth="0.5" fill="none" style={{ filter: "brightness(0.8)" }} />
        <path d="M25,35 Q35,20 38,8" stroke={color} strokeWidth="0.5" fill="none" style={{ filter: "brightness(0.8)" }} />
      </svg>
    );
  }
  
  // Staghorn coral
  return (
    <svg viewBox="0 0 50 50" fill="none" className="h-full w-full">
      <path d="M25,48 L25,30" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M25,30 L15,15 L10,5" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M25,30 L25,10 L22,2" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M25,30 L35,18 L40,8" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M15,15 L8,12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M35,18 L42,15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M25,20 L18,12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M25,20 L32,12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SchoolFishSVG({ color, count }: { color: string; count: number }) {
  const fishPositions = Array.from({ length: Math.min(count, 30) }, (_, i) => ({
    x: 10 + (i % 6) * 14 + (Math.floor(i / 6) % 2) * 7,
    y: 5 + Math.floor(i / 6) * 8,
    size: 0.8 + seededRandom(i * 3) * 0.4,
  }));

  return (
    <svg viewBox="0 0 100 40" fill="none" className="h-full w-full">
      {fishPositions.map((fish, i) => (
        <g key={i} transform={`translate(${fish.x}, ${fish.y}) scale(${fish.size})`}>
          <ellipse cx="5" cy="3" rx="5" ry="3" fill={color} fillOpacity={0.7 + seededRandom(i) * 0.3} />
          <polygon points="10,3 14,0 14,6" fill={color} fillOpacity={0.6 + seededRandom(i) * 0.3} />
          <circle cx="3" cy="2.5" r="0.8" fill="#000" fillOpacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

// WhytCard Fish variants - Easter eggs! Fish made from the WhytCard text
type WhytCardFishVariant = "classic" | "golden" | "neon" | "ghost" | "rainbow" | "deep";

const WHYTCARD_FISH_COLORS: Record<WhytCardFishVariant, { body: string; text: string; eye: string; glow: string }> = {
  classic: { body: "#22D3EE", text: "#22D3EE", eye: "#0E7490", glow: "#22D3EE" },
  golden: { body: "#FBBF24", text: "#F59E0B", eye: "#B45309", glow: "#FCD34D" },
  neon: { body: "#A855F7", text: "#C084FC", eye: "#7C3AED", glow: "#E879F9" },
  ghost: { body: "#94A3B8", text: "#CBD5E1", eye: "#475569", glow: "#E2E8F0" },
  rainbow: { body: "#EC4899", text: "#8B5CF6", eye: "#06B6D4", glow: "#F472B6" },
  deep: { body: "#0891B2", text: "#06B6D4", eye: "#164E63", glow: "#22D3EE" },
};

function WhytCardFishSVG({ direction, variant = "classic" }: { direction: number; variant?: WhytCardFishVariant }) {
  const colors = WHYTCARD_FISH_COLORS[variant];
  // Le poisson nage vers la gauche (direction -1) ou vers la droite (direction 1)
  // Le texte doit toujours être lisible dans le sens de la nage
  const isSwimmingLeft = direction === -1;
  
  return (
    <svg 
      viewBox="0 0 120 40" 
      fill="none" 
      className="h-full w-full"
      style={{ transform: isSwimmingLeft ? "scaleX(1)" : "scaleX(-1)" }}
    >
      {/* Fish body shape behind text - PLUS VISIBLE */}
      <ellipse cx="55" cy="20" rx="45" ry="14" fill={colors.body} fillOpacity="0.5" />
      
      {/* Tail fin - à droite (arrière du poisson) */}
      <polygon points="100,20 118,8 118,32" fill={colors.body} fillOpacity="0.6" />
      
      {/* Dorsal fin */}
      <path d="M40,6 Q55,0 70,6" fill={colors.body} fillOpacity="0.5" />
      
      {/* Pectoral fin */}
      <ellipse cx="35" cy="28" rx="8" ry="4" fill={colors.body} fillOpacity="0.4" />
      
      {/* WhytCard text as the fish pattern - BIEN VISIBLE */}
      {/* Le texte est toujours dans le bon sens grâce au double flip */}
      <g transform={isSwimmingLeft ? "" : "scale(-1,1) translate(-110,0)"}>
        <text 
          x="55" 
          y="24" 
          textAnchor="middle" 
          fill={colors.text} 
          fillOpacity="0.9"
          fontFamily="system-ui, sans-serif"
          fontSize="14"
          fontWeight="700"
          letterSpacing="1"
        >
          WhytCard
        </text>
      </g>
      
      {/* Eye - à gauche (tête du poisson) */}
      <circle cx="18" cy="18" r="5" fill={colors.eye} fillOpacity="0.7" />
      <circle cx="17" cy="17" r="2" fill={colors.glow} fillOpacity="0.9" />
      
      {/* Glow effect around body */}
      <ellipse cx="55" cy="20" rx="46" ry="15" fill="none" stroke={colors.glow} strokeWidth="2" strokeOpacity="0.4" />
      
      {/* Rainbow variant has special gradient stripe */}
      {variant === "rainbow" && (
        <defs>
          <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
            <stop offset="25%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="75%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      )}
      {variant === "rainbow" && (
        <ellipse cx="55" cy="20" rx="38" ry="8" fill="url(#rainbowGrad)" />
      )}
      
      {/* Neon variant has extra glow rings */}
      {variant === "neon" && (
        <>
          <ellipse cx="55" cy="20" rx="42" ry="12" fill="none" stroke="#E879F9" strokeWidth="1" strokeOpacity="0.15" />
          <ellipse cx="55" cy="20" rx="44" ry="13" fill="none" stroke="#F0ABFC" strokeWidth="0.5" strokeOpacity="0.1" />
        </>
      )}
      
      {/* Deep variant has bioluminescent spots */}
      {variant === "deep" && (
        <>
          <circle cx="35" cy="18" r="2" fill="#22D3EE" fillOpacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="22" r="1.5" fill="#22D3EE" fillOpacity="0.3">
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="18" r="1" fill="#22D3EE" fillOpacity="0.35">
            <animate attributeName="opacity" values="0.35;0.1;0.35" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

// WhytCard Modal Component
function WhytCardModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations("whytcard");
  
  const services = [
    { 
      url: "https://whytcard.ai", 
      icon: Bot,
      labelKey: "aiDev",
      gradient: "from-purple-500 to-pink-500",
    },
    { 
      url: "https://whytcard.dev", 
      icon: Code,
      labelKey: "fullDev",
      gradient: "from-cyan-500 to-blue-500",
    },
    { 
      url: "https://whytcard.website", 
      icon: Globe,
      labelKey: "webProject",
      gradient: "from-emerald-500 to-teal-500",
    },
    { 
      url: "https://whytweb.ch", 
      icon: Laptop,
      labelKey: "webService",
      gradient: "from-orange-500 to-amber-500",
    },
    { 
      url: "https://whytcard.cloud", 
      icon: Cloud,
      labelKey: "cloudProject",
      gradient: "from-indigo-500 to-violet-500",
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effects */}
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Header */}
            <div className="relative mb-6 text-center">
              <motion.div
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">WhytCard</span>
              </motion.div>
              
              <motion.h2
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {t("title")}
              </motion.h2>
              
              <motion.p
                className="mt-2 text-sm text-white/60"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t("subtitle")}
              </motion.p>
            </div>
            
            {/* Services */}
            <div className="relative space-y-3">
              {services.map((service, index) => (
                <motion.a
                  key={service.url}
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${service.gradient} text-white shadow-lg`}>
                    <service.icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 font-medium text-white">
                    {t(service.labelKey)}
                  </span>
                  <motion.span
                    className="text-white/40 transition-transform group-hover:translate-x-1 group-hover:text-white/60"
                    initial={{ x: 0 }}
                  >
                    →
                  </motion.span>
                </motion.a>
              ))}
            </div>
            
            {/* Footer */}
            <motion.p
              className="mt-6 text-center text-xs text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {t("footer")}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// WhytCard fish data for multiple instances
type WhytCardFishData = {
  id: number;
  variant: WhytCardFishVariant;
  y: number; // vertical position %
  size: number;
  speed: number; // duration in seconds
  delay: number;
  direction: 1 | -1;
};

// PERFORMANCE: Reduced from 8 to 4 fish
const WHYTCARD_FISH: WhytCardFishData[] = [
  { id: 0, variant: "classic", y: 30, size: 120, speed: 25, delay: 0, direction: -1 },
  { id: 1, variant: "rainbow", y: 12, size: 130, speed: 20, delay: 5, direction: -1 },
  { id: 2, variant: "neon", y: 50, size: 110, speed: 22, delay: 3, direction: -1 },
  { id: 3, variant: "deep", y: 75, size: 95, speed: 26, delay: 15, direction: 1 },
];

// ===========================================
// MAIN COMPONENT
// ===========================================

export function OceanCanvas() {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [whytCardModalOpen, setWhytCardModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // PERFORMANCE: Track visibility
  // Prevent hydration mismatch - only render on client
  const isMounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const previousPageIndex = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // PERFORMANCE: Pause animations when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // PERFORMANCE: If tab is not visible, render only static background
  const shouldAnimate = isVisible && !prefersReducedMotion;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS (React Rules of Hooks)
  
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
  // PERFORMANCE: Reduced counts by ~50% for better FPS
  const particles = useMemo(() => generateParticles(40), []);
  const jellyfish = useMemo(() => generateJellyfish(5), []);
  const fish = useMemo(() => generateFish(6), []);
  
  // Surface zone
  const tropicalFish = useMemo(() => generateTropicalFish(10), []);
  const bubbles = useMemo(() => generateBubbles(12), []);
  
  // Middle zone
  const seaTurtles = useMemo(() => generateSeaTurtles(2), []);
  const mantaRays = useMemo(() => generateMantaRays(1), []);
  
  // Deep zone
  const sharks = useMemo(() => generateSharks(2), []);
  const abyssalFish = useMemo(() => generateAbyssalFish(6), []);
  const marineSnow = useMemo(() => generateMarineSnow(20), []);
  const seaAnemones = useMemo(() => generateSeaAnemones(3), []);
  
  // New marine life - Surface
  const seahorses = useMemo(() => generateSeahorses(3), []);
  const clownfish = useMemo(() => generateClownfish(6), []);
  
  // New marine life - Middle
  const dolphins = useMemo(() => generateDolphins(2), []);
  const whales = useMemo(() => generateWhales(1), []);
  const schoolFish = useMemo(() => generateSchoolFish(3), []);
  
  // New marine life - Deep
  const octopuses = useMemo(() => generateOctopuses(2), []);
  const giantSquids = useMemo(() => generateGiantSquids(2), []);
  const corals = useMemo(() => generateCorals(4), []);

  useEffect(() => {
    // Only attach scroll listener when animating
    if (!shouldAnimate) return;
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    requestAnimationFrame(() => {
      handleScroll();
    });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, shouldAnimate]);

  // Use 0 as base until mounted to prevent hydration mismatch (flash of different colors)
  const effectiveScrollProgress = isMounted ? scrollProgress : 0;
  
  const depth = Math.round(effectiveScrollProgress * 40);

  // CONDITIONAL RETURNS - All hooks have been called above
  
  // Not mounted yet - prevent hydration mismatch
  if (!isMounted) {
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

  // PERFORMANCE: Static-only render when animations are paused (tab hidden or reduced motion)
  if (!shouldAnimate) {
    return (
      <div 
        ref={containerRef}
        className="pointer-events-none fixed inset-0 -z-50 overflow-hidden" 
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              hsl(182, 58%, 28%) 0%,
              hsl(187, 55%, 24%) 25%,
              hsl(194, 50%, 20%) 50%,
              hsl(200, 44%, 16%) 75%,
              hsl(204, 40%, 12%) 100%
            )`,
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

  // ===========================================
  // DEPTH ZONES - Realistic marine habitats
  // ===========================================
  // 0-15%: Sunlight Zone (Epipelagic) - tropical fish, seahorses, clownfish
  // 15-30%: Twilight Zone (Mesopelagic) - dolphins, small sharks, schools
  // 30-50%: Midnight Zone (Bathypelagic) - whales, large sharks, jellyfish
  // 50-70%: Abyssal Zone (Abyssopelagic) - giant squid, deep fish, some octopus
  // 70-100%: Hadal Zone (Hadopelagic) - anglerfish, marine snow, sparse life
  
  // Sunlight Zone (0-20%) - Most life, colorful
  const sunlightZone = Math.max(0, 1 - effectiveScrollProgress * 5); // Fades by 20%

  return (
    <div 
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-50 overflow-hidden" 
      aria-hidden="true"
      style={{ 
        // PERFORMANCE: GPU acceleration
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Camera container with horizontal movement */}
      <motion.div
        className="absolute inset-y-0 left-0 h-full w-[500vw]"
        animate={isVisible ? { x: cameraX + "vw" } : undefined}
        transition={{
          type: "spring",
          stiffness: 30,
          damping: 25,
          mass: 1.2,
        }}
        style={{
          willChange: isVisible ? 'transform' : 'auto',
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

        {/* Rising bubbles - More visible near surface (0-30%) */}
        {bubbles.map((b) => {
          // Bubbles are more visible in sunlit waters
          const bubbleVisibility = effectiveScrollProgress < 0.35 
            ? Math.max(0.2, 0.7 - effectiveScrollProgress * 1.5) 
            : 0.1;
          
          return (
          <motion.div
            key={`bubble-${b.id}`}
            className="absolute rounded-full"
            style={{
              left: `${b.x}%`,
              width: b.size,
              height: b.size,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2))",
              border: "1px solid rgba(255,255,255,0.3)",
              opacity: bubbleVisibility,
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
          );
        })}

        {/* Tropical fish schools - Sunlight Zone ONLY (0-18%) */}
        {tropicalFish.map((tf) => {
          // Tropical fish need warm sunlit waters
          if (sunlightZone <= 0.1) return null;
          
          return (
            <motion.div
              key={`tropical-${tf.id}`}
              className="absolute"
              style={{
                top: `${tf.y}%`,
                width: tf.size,
                height: tf.size * 0.6,
                opacity: sunlightZone * 0.9,
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

        {/* Seahorses - Sunlight Zone ONLY (0-15%) */}
        {seahorses.map((sh) => {
          // Seahorses only live in shallow coral reefs
          if (sunlightZone <= 0.1) return null;
          
          return (
            <motion.div
              key={`seahorse-${sh.id}`}
              className="absolute"
              style={{
                left: `${sh.x}%`,
                top: `${sh.y}%`,
                width: sh.size,
                height: sh.size * 1.5,
                opacity: sunlightZone * 0.85,
              }}
              animate={{
                y: [0, -15, 0, 15, 0],
                x: [0, 5, -5, 0],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                x: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <SeahorseSVG color={sh.color} direction={sh.direction} />
            </motion.div>
          );
        })}

        {/* Clownfish - Sunlight Zone ONLY (0-15%) - live in anemones */}
        {clownfish.map((cf) => {
          // Clownfish are strictly shallow reef dwellers
          if (sunlightZone <= 0.15) return null;
          
          return (
            <motion.div
              key={`clownfish-${cf.id}`}
              className="absolute"
              style={{
                left: `${cf.x}%`,
                top: `${cf.y}%`,
                width: cf.size,
                height: cf.size * 0.625,
                opacity: sunlightZone * 0.9,
              }}
              animate={{
                x: [-20, 20, -20],
                y: [0, -8 - cf.anemoneOffset, 0, 8 + cf.anemoneOffset, 0],
              }}
              transition={{
                x: { duration: cf.speed, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 2 + cf.anemoneOffset, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <ClownfishSVG direction={cf.direction} />
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

        {/* Jellyfish - All zones but peak in Twilight/Midnight (15-70%) */}
        {jellyfish.map((jelly) => {
          const parallaxY = jelly.y - effectiveScrollProgress * 50;
          // Jellyfish exist at many depths, bioluminescent ones deeper
          const jellyVisibility = effectiveScrollProgress > 0.1 && effectiveScrollProgress < 0.75 
            ? Math.min(0.9, Math.min((effectiveScrollProgress - 0.1) * 2, (0.75 - effectiveScrollProgress) * 2)) 
            : 0;
          const jellyOpacity = parallaxY > -30 && parallaxY < 130 ? jellyVisibility : 0;
          
          if (jellyOpacity <= 0.05) return null;
          
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

        {/* Sea Turtles - Sunlight to Twilight Zone (5-40%) - breathe air */}
        {seaTurtles.map((turtle) => {
          // Sea turtles need to surface for air, stay in upper zones
          const turtleVisibility = effectiveScrollProgress > 0.03 && effectiveScrollProgress < 0.45 
            ? Math.min(0.9, Math.min((effectiveScrollProgress - 0.03) * 4, (0.45 - effectiveScrollProgress) * 3)) 
            : 0;
          if (turtleVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`turtle-${turtle.id}`}
              className="absolute"
              style={{
                top: `${turtle.y}%`,
                width: turtle.size,
                height: turtle.size * 0.625,
                opacity: turtleVisibility * 0.85,
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

        {/* Manta Rays - Sunlight to Twilight Zone (10-45%) - filter feeders */}
        {mantaRays.map((manta) => {
          // Manta rays feed on plankton in sunlit waters
          const mantaVisibility = effectiveScrollProgress > 0.08 && effectiveScrollProgress < 0.5 
            ? Math.min(0.8, Math.min((effectiveScrollProgress - 0.08) * 3, (0.5 - effectiveScrollProgress) * 2.5)) 
            : 0;
          if (mantaVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`manta-${manta.id}`}
              className="absolute"
              style={{
                top: `${manta.y}%`,
                width: manta.size,
                height: manta.size * 0.5,
                opacity: mantaVisibility * 0.7,
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

        {/* Dolphins - Twilight Zone (10-35%) - breathe air, dive moderately */}
        {dolphins.map((dolphin) => {
          // Dolphins dive but need to return to surface
          const dolphinVisibility = effectiveScrollProgress > 0.05 && effectiveScrollProgress < 0.4 
            ? Math.min(0.9, Math.min((effectiveScrollProgress - 0.05) * 5, (0.4 - effectiveScrollProgress) * 4)) 
            : 0;
          if (dolphinVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`dolphin-${dolphin.id}`}
              className="absolute"
              style={{
                top: `${dolphin.y}%`,
                width: dolphin.size,
                height: dolphin.size * 0.4,
                opacity: dolphinVisibility * 0.85,
              }}
              animate={{
                x: dolphin.direction === 1 ? ["-15vw", "115vw"] : ["115vw", "-15vw"],
                y: [0, -30, 0, -25, 0], // Playful jumping motion
                rotate: [0, dolphin.direction * -15, 0, dolphin.direction * -10, 0],
              }}
              transition={{
                x: { duration: dolphin.speed, repeat: Infinity, ease: "linear", delay: dolphin.podOffset },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <DolphinSVG direction={dolphin.direction} />
            </motion.div>
          );
        })}

        {/* Whales - Twilight to Midnight Zone (15-55%) - deep divers */}
        {whales.map((whale) => {
          // Whales can dive deep but are more common in upper-middle depths
          const whaleVisibility = effectiveScrollProgress > 0.12 && effectiveScrollProgress < 0.55 
            ? Math.min(0.65, Math.min((effectiveScrollProgress - 0.12) * 2.5, (0.55 - effectiveScrollProgress) * 2)) 
            : 0;
          
          if (whaleVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`whale-${whale.id}`}
              className="absolute"
              style={{
                top: `${whale.y}%`,
                width: whale.size,
                height: whale.type === "orca" ? whale.size * 0.33 : whale.size * 0.4,
                opacity: whaleVisibility,
              }}
              animate={{
                x: whale.direction === 1 ? ["-25vw", "125vw"] : ["125vw", "-25vw"],
                y: [0, -20, 0],
              }}
              transition={{
                x: { duration: whale.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <WhaleSVG direction={whale.direction} type={whale.type} />
            </motion.div>
          );
        })}

        {/* Schools of small fish - Sunlight to Twilight Zone (0-35%) */}
        {schoolFish.map((school) => {
          // Schools of fish need light to coordinate, disappear in darkness
          const schoolVisibility = effectiveScrollProgress < 0.38 
            ? Math.min(0.8, 0.8 - effectiveScrollProgress * 1.5) 
            : 0;
          
          if (schoolVisibility <= 0.1) return null;
          
          return (
            <motion.div
              key={`school-${school.id}`}
              className="absolute"
              style={{
                top: `${school.y}%`,
                width: school.size * 25,
                height: school.size * 10,
                opacity: schoolVisibility,
                transform: school.direction === -1 ? "scaleX(-1)" : "none",
              }}
              animate={{
                x: school.direction === 1 ? ["-20vw", "120vw"] : ["120vw", "-20vw"],
                y: [0, -15, 5, -10, 0],
                scaleY: [1, 0.9, 1.1, 0.95, 1],
              }}
              transition={{
                x: { duration: school.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                scaleY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <SchoolFishSVG color={school.color} count={school.fishCount} />
            </motion.div>
          );
        })}

        {/* ========================================= */}
        {/* DEEP ZONE (50-100%) - Dark creatures */}
        {/* ========================================= */}

        {/* Marine Snow - Increases with depth (30-100%) */}
        {marineSnow.map((snow) => {
          // Marine snow (dead organic matter) increases as we go deeper
          const snowVisibility = effectiveScrollProgress > 0.25 
            ? Math.min(0.5, (effectiveScrollProgress - 0.25) * 0.7) 
            : 0;
          if (snowVisibility <= 0.05) return null;
          
          return (
            <motion.div
              key={`snow-${snow.id}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${snow.x}%`,
                width: snow.size,
                height: snow.size,
                opacity: snowVisibility,
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

        {/* Deep fish - Midnight to Abyssal Zone (35-75%) */}
        {fish.map((f) => {
          // Silhouette fish in the darker middle depths
          const fishOpacity = effectiveScrollProgress > 0.3 && effectiveScrollProgress < 0.8 
            ? Math.min(0.6, Math.min((effectiveScrollProgress - 0.3) * 1.5, (0.8 - effectiveScrollProgress) * 2)) 
            : 0;
          
          if (fishOpacity <= 0.05) return null;
          
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

        {/* Sharks - Twilight to Midnight Zone (20-60%) - apex predators */}
        {sharks.map((shark) => {
          // Sharks patrol various depths but avoid the deepest abyss
          const sharkVisibility = effectiveScrollProgress > 0.18 && effectiveScrollProgress < 0.65 
            ? Math.min(0.7, Math.min((effectiveScrollProgress - 0.18) * 2.5, (0.65 - effectiveScrollProgress) * 2.5)) 
            : 0;
          if (sharkVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`shark-${shark.id}`}
              className="absolute"
              style={{
                top: `${shark.y}%`,
                width: shark.size,
                height: shark.size * 0.4,
                opacity: sharkVisibility * 0.6,
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

        {/* Abyssal fish with bioluminescence - Abyssal to Hadal Zone (55-100%) */}
        {abyssalFish.map((af) => {
          const parallaxY = af.y - effectiveScrollProgress * 20;
          // Anglerfish and bioluminescent creatures only in true darkness
          const abyssalFishVisibility = effectiveScrollProgress > 0.5 
            ? Math.min(0.8, (effectiveScrollProgress - 0.5) * 1.6) 
            : 0;
          
          if (abyssalFishVisibility <= 0 || parallaxY < 50) return null;
          
          return (
            <motion.div
              key={`abyssal-${af.id}`}
              className="absolute"
              style={{
                left: `${af.x}%`,
                top: `${parallaxY}%`,
                width: af.size,
                height: af.size * 0.66,
                opacity: abyssalFishVisibility * 0.8,
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

        {/* Sea Anemones - Sunlight Zone (0-25%) - symbiotic with clownfish */}
        {seaAnemones.map((anemone) => {
          // Anemones need light for their symbiotic algae
          const anemoneVisibility = effectiveScrollProgress < 0.3 
            ? Math.min(0.8, 0.8 - effectiveScrollProgress * 2) 
            : 0;
          if (anemoneVisibility <= 0.1) return null;
          
          return (
            <motion.div
              key={`anemone-${anemone.id}`}
              className="absolute"
              style={{
                left: `${anemone.x}%`,
                top: `${80 + anemone.y * 0.2}%`, // Near the bottom of visible area
                width: anemone.size,
                height: anemone.size,
                opacity: anemoneVisibility * 0.7,
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

        {/* Octopuses - Midnight to Abyssal Zone (35-75%) - intelligent hunters */}
        {octopuses.map((octo) => {
          // Octopuses live at various depths, some very deep
          const octoVisibility = effectiveScrollProgress > 0.3 && effectiveScrollProgress < 0.8 
            ? Math.min(0.75, Math.min((effectiveScrollProgress - 0.3) * 2, (0.8 - effectiveScrollProgress) * 2)) 
            : 0;
          if (octoVisibility <= 0) return null;
          
          return (
            <motion.div
              key={`octopus-${octo.id}`}
              className="absolute"
              style={{
                left: `${octo.x}%`,
                top: `${octo.y}%`,
                width: octo.size,
                height: octo.size * 0.93,
                opacity: octoVisibility * 0.75,
              }}
              animate={{
                x: [0, 15, -10, 5, 0],
                y: [0, -20, 0, -15, 0],
                scale: [1, 1.05, 0.95, 1.02, 1],
              }}
              transition={{
                x: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <OctopusSVG color={octo.color} />
            </motion.div>
          );
        })}

        {/* Giant Squids - Abyssal Zone ONLY (55-90%) - true deep sea creatures */}
        {giantSquids.map((squid) => {
          // Giant squids only exist in the deep darkness
          const squidVisibility = effectiveScrollProgress > 0.5 && effectiveScrollProgress < 0.95 
            ? Math.min(0.6, Math.min((effectiveScrollProgress - 0.5) * 1.5, (0.95 - effectiveScrollProgress) * 2)) 
            : 0;
          
          if (squidVisibility <= 0.05) return null;
          
          return (
            <motion.div
              key={`squid-${squid.id}`}
              className="absolute"
              style={{
                top: `${squid.y}%`,
                width: squid.size,
                height: squid.size * 0.42,
                opacity: squidVisibility,
              }}
              animate={{
                x: squid.direction === 1 ? ["-20vw", "120vw"] : ["120vw", "-20vw"],
                y: [0, -25, 0, 20, 0],
              }}
              transition={{
                x: { duration: squid.speed, repeat: Infinity, ease: "linear" },
                y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <GiantSquidSVG direction={squid.direction} glowColor={squid.glowColor} />
            </motion.div>
          );
        })}

        {/* WhytCard Fish School - Easter eggs! Click to open modal */}
        {WHYTCARD_FISH.map((fish) => {
          const colors = WHYTCARD_FISH_COLORS[fish.variant];
          
          return (
            <motion.button
              key={`whytcard-fish-${fish.id}`}
              onClick={() => setWhytCardModalOpen(true)}
              className="absolute pointer-events-auto cursor-pointer border-0 bg-transparent p-0"
              style={{
                top: `${fish.y}%`,
                width: fish.size,
                height: fish.size * 0.35,
                opacity: 0.85,
                zIndex: 10,
              }}
              animate={{
                x: fish.direction === 1 
                  ? ["-15vw", "115vw"] 
                  : ["115vw", "-15vw"],
                y: [0, -20 - fish.id * 3, 0, 18 + fish.id * 3, 0],
              }}
              transition={{
                x: { duration: fish.speed, repeat: Infinity, ease: "linear", delay: fish.delay },
                y: { duration: 5 + fish.id * 0.5, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ 
                scale: 1.5, 
                opacity: 1,
                filter: `drop-shadow(0 0 20px ${colors.glow}) drop-shadow(0 0 40px ${colors.glow})`,
              }}
              title="Made with ❤️ by WhytCard"
            >
              <WhytCardFishSVG direction={fish.direction} variant={fish.variant} />
            </motion.button>
          );
        })}

        {/* Corals - Sunlight Zone ONLY (0-20%) - need light for photosynthesis */}
        {corals.map((coral) => {
          // Corals need sunlight, they don't exist in deep water
          // Show them at low scroll as bottom decoration
          const coralVisibility = effectiveScrollProgress < 0.25 
            ? Math.min(0.7, 0.7 - effectiveScrollProgress * 2) 
            : 0;
          if (coralVisibility <= 0.1) return null;
          
          return (
            <motion.div
              key={`coral-${coral.id}`}
              className="absolute"
              style={{
                left: `${coral.x}%`,
                top: `${85 + coral.y * 0.15}%`, // Keep near bottom of visible area
                width: coral.size,
                height: coral.size,
                opacity: coralVisibility * 0.75,
              }}
              animate={{
                scale: [1, 1.03, 1],
                rotate: coral.type === "fan" ? [-2, 2, -2] : [0, 0, 0],
              }}
              transition={{
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              <CoralSVG color={coral.color} type={coral.type} />
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

      {/* WhytCard Modal */}
      <WhytCardModal 
        isOpen={whytCardModalOpen} 
        onClose={() => setWhytCardModalOpen(false)} 
      />
    </div>
  );
}
