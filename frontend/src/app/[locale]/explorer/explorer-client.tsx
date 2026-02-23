"use client";

import { motion } from "framer-motion";
import { DiveGuideChat } from "@/components/explorer/dive-guide-chat";

export function ExplorerClient() {
  return (
    <div className="min-h-[calc(100svh-6rem)] ocean-gradient-hero">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass h-[calc(100dvh-13rem)] min-h-[500px] overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/10"
          >
            <DiveGuideChat />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
