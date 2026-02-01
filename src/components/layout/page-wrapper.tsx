"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, useRef, useEffect, useState } from "react";

/**
 * PageWrapper - Wraps page content with horizontal slide transitions
 * Synchronized with the ocean background camera movement
 * 
 * SYNCHRONIZATION:
 * - Uses IDENTICAL spring config as OceanCanvas (stiffness: 30, damping: 25, mass: 1.2)
 * - This ensures content and background move together seamlessly
 * 
 * NAVIGATION:
 * - RIGHT (page 1 → page 2): current slides LEFT, new enters from RIGHT
 * - LEFT (page 2 → page 1): current slides RIGHT, new enters from LEFT
 * 
 * ACCESSIBILITY:
 * - Respects prefers-reduced-motion
 * - Maintains focus management
 */

// Page order (MUST match ocean-canvas.tsx)
const PAGE_ORDER = [
  "", // home (/)
  "about",
  "explorer", 
  "centers",
  "contact",
  "login",
  "register",
];

// Shared spring config - MUST match OceanCanvas exactly
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 30,
  damping: 25,
  mass: 1.2,
};

// Animation duration estimate for cleanup (spring ~1000-1200ms)
const TRANSITION_DURATION = 1200;

function getPageIndex(pathname: string): number {
  const segments = pathname.split("/").filter(Boolean);
  const pageSegment = segments[1] || "";
  const index = PAGE_ORDER.indexOf(pageSegment);
  return index >= 0 ? index : 0;
}

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();
  const currentIndex = getPageIndex(pathname);
  const previousIndexRef = useRef<number>(currentIndex);
  const previousChildrenRef = useRef<ReactNode>(children);
  const [prevChildren, setPrevChildren] = useState<ReactNode | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<number>(0);
  const [previousPathname, setPreviousPathname] = useState<string>(pathname);

  useEffect(() => {
    const currentDirection = currentIndex - previousIndexRef.current;
    
    if (pathname !== previousPathname && currentDirection !== 0) {
      // Store previous children for transition
      setPrevChildren(previousChildrenRef.current);
      setIsTransitioning(true);
      setDirection(currentDirection);
      setPreviousPathname(pathname);
      
      // Update refs
      previousChildrenRef.current = children;
      
      // Clear transition after animation completes
      const timer = setTimeout(() => {
        setPrevChildren(null);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);
      
      return () => clearTimeout(timer);
    } else {
      // Update ref if pathname hasn't changed but children have
      previousChildrenRef.current = children;
      if (pathname === previousPathname) {
        setIsTransitioning(false);
        setPrevChildren(null);
      }
    }
    
    previousIndexRef.current = currentIndex;
  }, [currentIndex, pathname, children, previousPathname]);

  // Reduced motion: instant transitions without animation
  if (prefersReducedMotion) {
    return (
      <div className="relative w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      {/* Previous page - slides out */}
      {isTransitioning && prevChildren && (
        <motion.div
          key={`prev-${previousPathname}`}
          initial={{ x: 0, opacity: 1 }}
          animate={{
            x: direction > 0 ? "-100%" : direction < 0 ? "100%" : 0,
            opacity: 0,
          }}
          transition={SPRING_CONFIG}
          className="absolute inset-0 w-full"
          style={{ zIndex: 1 }}
        >
          {prevChildren}
        </motion.div>
      )}
      
      {/* Current page - slides in */}
      <motion.div
        key={`current-${pathname}`}
        initial={{
          x: isTransitioning ? (direction > 0 ? "100%" : direction < 0 ? "-100%" : 0) : 0,
          opacity: isTransitioning ? 0 : 1,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        transition={SPRING_CONFIG}
        className="relative w-full"
        style={{ zIndex: 2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
