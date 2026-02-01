"use client";

import { useTranslations } from "next-intl";

function useImageTranslations() {
  return useTranslations("images");
}
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Search, MapPin, Calendar, Users, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LightRays } from "@/components/effects/floating-particles";
import { useEffect, useState } from "react";
import Image from "next/image";

// Animated depth counter
function DepthCounter() {
  const [depth, setDepth] = useState(0);
  const targetDepth = 40;

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDepth((prev) => {
          if (prev >= targetDepth) {
            clearInterval(interval);
            return targetDepth;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="absolute bottom-8 left-8 hidden items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-md md:flex"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <Waves className="h-5 w-5 text-cyan-400" />
      <div className="depth-meter text-lg font-mono">
        <span className="text-white/60">Profondeur : </span>
        <span className="text-cyan-400">{depth}</span>
        <span className="text-white/40">m</span>
      </div>
    </motion.div>
  );
}

// Floating decoration orbs
function FloatingOrbs() {
  return (
    <>
      {/* Large glow orb (subtle cyan, darker) */}
      <motion.div
        className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Medium glow orb (subtle blue, darker) */}
      <motion.div
        className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.10, 0.18, 0.10],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Small floating orbs (subtle cyan) */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-cyan-300/25"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </>
  );
}

export function HeroSection() {
  const t = useTranslations("hero");
  const tSearch = useTranslations("search");
  const tImages = useImageTranslations();

  // Mouse parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const titleX = useTransform(smoothX, [-500, 500], [-10, 10]);
  const titleY = useTransform(smoothY, [-500, 500], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-20">
      {/* Light rays effect */}
      <LightRays className="opacity-25" />
      
      {/* Floating decorations */}
      <FloatingOrbs />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          <span className="text-sm font-medium text-cyan-300">
            Découvrez les profondeurs
          </span>
        </motion.div>

        {/* Logo with parallax */}
        <motion.div
          className="mb-6 flex items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ x: titleX, y: titleY }}
        >
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 20px rgba(34, 211, 238, 0))",
                "drop-shadow(0 0 40px rgba(34, 211, 238, 0.4))",
                "drop-shadow(0 0 20px rgba(34, 211, 238, 0))",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/evidive-logo.png"
              alt={tImages("evidiveLogo")}
              width={400}
              height={120}
              className="h-auto w-64 sm:w-80 md:w-96"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Subtitle with stagger */}
        <motion.p
          className="mx-auto mb-12 max-w-2xl text-lg text-white/70 sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          {t("subtitle")}
        </motion.p>

        {/* Search Box with hover effects */}
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="glass rounded-2xl p-3 sm:p-4"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Location */}
              <motion.div
                className="relative flex-1"
                whileFocus={{ scale: 1.02 }}
              >
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <Input
                  placeholder={tSearch("where")}
                  className="h-12 border-0 bg-white/10 pl-10 text-white placeholder:text-white/50 focus-visible:ring-cyan-400"
                />
              </motion.div>

              {/* Date */}
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <Input
                  type="date"
                  placeholder={tSearch("when")}
                  className="h-12 border-0 bg-white/10 pl-10 text-white placeholder:text-white/50 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Guests */}
              <div className="relative w-full sm:w-32">
                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
                <Input
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={2}
                  placeholder={tSearch("guests")}
                  className="h-12 border-0 bg-white/10 pl-10 text-white placeholder:text-white/50 focus-visible:ring-cyan-400"
                />
              </div>

              {/* Search Button with glow */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="h-12 bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/40"
                >
                  <Search className="mr-2 h-5 w-5" />
                  {tSearch("searchButton")}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-xs text-white/40">{t("scroll")}</span>
            <div className="h-12 w-6 rounded-full border border-white/20 p-1">
              <motion.div
                className="h-2 w-2 rounded-full bg-cyan-400"
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Depth counter */}
      <DepthCounter />
    </section>
  );
}
