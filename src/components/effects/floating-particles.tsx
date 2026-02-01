"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  type: "bubble" | "glow" | "dust";
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
  variant?: "bubbles" | "glow" | "mixed";
}

function generateParticles(count: number, variant: string): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const types: Particle["type"][] =
      variant === "bubbles"
        ? ["bubble"]
        : variant === "glow"
          ? ["glow"]
          : ["bubble", "glow", "dust"];
    
    return {
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 8 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
      type: types[Math.floor(Math.random() * types.length)],
    };
  });
}

export function FloatingParticles({
  count = 30,
  className = "",
  variant = "mixed",
}: FloatingParticlesProps) {
  const prefersReducedMotion = useReducedMotion();
  
  const particles = useMemo(
    () => generateParticles(count, variant),
    [count, variant]
  );

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            background:
              particle.type === "bubble"
                ? "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05))"
                : particle.type === "glow"
                  ? "radial-gradient(circle, rgba(34, 211, 238, 0.22), transparent)"
                  : "rgba(255, 255, 255, 0.3)",
            boxShadow:
              particle.type === "bubble"
                ? "inset 0 0 4px rgba(255, 255, 255, 0.3)"
                : particle.type === "glow"
                  ? "0 0 10px rgba(34, 211, 238, 0.18)"
                  : "none",
          }}
          initial={{
            y: "100vh",
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: "-10vh",
            opacity: [0, particle.opacity, particle.opacity, 0],
            scale: [0, 1, 1, 0.5],
            x: [0, Math.sin(particle.id) * 30, Math.sin(particle.id * 2) * -20, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Composant de bulles spécifique pour les sections
export function SectionBubbles({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  const bubbles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        size: 20 + (i * 7) % 60,
        left: 10 + (i * 12) % 80,
        delay: (i * 0.4) % 3,
        duration: 6 + (i % 4) * 2,
      })),
    []
  );

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            bottom: -bubble.size,
          }}
          animate={{
            y: [0, "-120vh"],
            x: [0, Math.sin(bubble.id) * 50, Math.cos(bubble.id) * -30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Effet de rayons de lumière
export function LightRays({ className = "" }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full w-px origin-top"
          style={{
            left: `${15 + i * 18}%`,
            background: "linear-gradient(to bottom, rgba(34, 211, 238, 0.18), transparent 70%)",
            transform: `rotate(${-15 + i * 8}deg)`,
          }}
          animate={{
            opacity: [0.08, 0.22, 0.08],
            scaleY: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
