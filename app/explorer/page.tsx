'use client';

import { motion } from 'framer-motion';
import { DiveGuideChat } from '@/components/explorer/dive-guide-chat';

export default function ExplorerPage() {
  return (
    <div className="pt-16 min-h-screen ocean-gradient-hero">
      <div className="container-custom py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 min-h-[500px] h-[calc(100dvh-180px)]"
          >
            <DiveGuideChat />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
