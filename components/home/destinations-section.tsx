"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Star, ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n/use-translations";

const destinations = [
  {
    id: "maldives",
    key: "maldives",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 2340,
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "bali",
    key: "bali",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
    rating: 4.8,
    reviews: 1890,
    color: "from-emerald-500/20 to-cyan-500/20",
  },
  {
    id: "red-sea",
    key: "redSea",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop",
    rating: 4.7,
    reviews: 3210,
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    id: "great-barrier",
    key: "greatBarrier",
    image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop",
    rating: 4.9,
    reviews: 4520,
    color: "from-blue-500/20 to-indigo-500/20",
  },
] as const;

export function DestinationsSection() {
  const t = useTranslations("destinations");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section ref={sectionRef} className="relative py-32">
      {/* Ambient glow */}
      <motion.div
        className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
          >
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">
              {t("badge")}
            </span>
          </motion.div>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t("title")}
          </h2>
          <p className="text-lg text-white/60">{t("subtitle")}</p>
        </motion.div>

        {/* Destinations Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredId(destination.id)}
              onHoverEnd={() => setHoveredId(null)}
            >
              <Card className="group cursor-pointer overflow-hidden border-0 bg-transparent">
                <CardContent className="p-0">
                  <motion.div
                    className="relative aspect-[4/5] overflow-hidden rounded-2xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Image */}
                    <Image
                      src={destination.image}
                      alt={t(`${destination.key}.name`)}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Colored overlay on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-t ${destination.color}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredId === destination.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Main overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Shine effect on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: hoveredId === destination.id ? "100%" : "-100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <motion.span
                        className="text-sm text-cyan-400"
                        animate={{
                          y: hoveredId === destination.id ? -4 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {t(`${destination.key}.region`)}
                      </motion.span>
                      <motion.h3
                        className="mt-1 text-2xl font-bold text-white"
                        animate={{
                          y: hoveredId === destination.id ? -4 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.05 }}
                      >
                        {t(`${destination.key}.name`)}
                      </motion.h3>
                      <motion.p
                        className="mt-1 text-sm text-white/70"
                        animate={{
                          y: hoveredId === destination.id ? -4 : 0,
                          opacity: hoveredId === destination.id ? 1 : 0.7,
                        }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      >
                        {t(`${destination.key}.description`)}
                      </motion.p>
                      
                      {/* Rating */}
                      <motion.div
                        className="mt-3 flex items-center justify-between"
                        animate={{
                          y: hoveredId === destination.id ? -4 : 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
                      >
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-white">
                            {destination.rating}
                          </span>
                          <span className="text-sm text-white/50">
                            ({destination.reviews.toLocaleString("en-US")} {t("reviews")})
                          </span>
                        </div>
                        
                        {/* Arrow on hover */}
                        <motion.div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: hoveredId === destination.id ? 1 : 0,
                            scale: hoveredId === destination.id ? 1 : 0.5,
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
