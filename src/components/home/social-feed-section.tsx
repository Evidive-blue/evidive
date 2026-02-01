"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Facebook, Instagram, RefreshCcw, Heart, MessageCircle, Share2 } from "lucide-react";

type SocialPlatform = "instagram" | "facebook";
type SocialFilter = "all" | SocialPlatform;

type SocialPost = {
  id: string;
  platform: SocialPlatform;
  imageUrl: string;
  gradientClassName: string;
  likes: number;
  comments: number;
};

const POSTS: readonly SocialPost[] = [
  {
    id: "ig-1",
    platform: "instagram",
    imageUrl:
      "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=900&h=900&fit=crop",
    gradientClassName: "from-fuchsia-500/20 via-purple-500/10 to-transparent",
    likes: 1234,
    comments: 56,
  },
  {
    id: "fb-1",
    platform: "facebook",
    imageUrl:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=900&h=900&fit=crop",
    gradientClassName: "from-blue-500/20 via-cyan-500/10 to-transparent",
    likes: 892,
    comments: 34,
  },
  {
    id: "ig-2",
    platform: "instagram",
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&h=900&fit=crop",
    gradientClassName: "from-pink-500/20 via-fuchsia-500/10 to-transparent",
    likes: 2156,
    comments: 89,
  },
  {
    id: "fb-2",
    platform: "facebook",
    imageUrl:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=900&h=900&fit=crop",
    gradientClassName: "from-sky-500/20 via-blue-500/10 to-transparent",
    likes: 567,
    comments: 23,
  },
  {
    id: "ig-3",
    platform: "instagram",
    imageUrl:
      "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=900&h=900&fit=crop",
    gradientClassName: "from-purple-500/20 via-blue-500/10 to-transparent",
    likes: 3421,
    comments: 127,
  },
  {
    id: "fb-3",
    platform: "facebook",
    imageUrl:
      "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=900&h=900&fit=crop",
    gradientClassName: "from-cyan-500/20 via-emerald-500/10 to-transparent",
    likes: 789,
    comments: 45,
  },
] as const;

export function SocialFeedSection() {
  const t = useTranslations("socialFeed");
  const [filter, setFilter] = useState<SocialFilter>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const visiblePosts = useMemo(() => {
    if (filter === "all") return POSTS;
    return POSTS.filter((post) => post.platform === filter);
  }, [filter]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-32">
      {/* Decorative blobs */}
      <motion.div
        className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute -left-32 bottom-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
          >
            <Instagram className="h-4 w-4" />
            Rejoignez la communauté
          </motion.span>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            {t("title")}
          </h2>
          <p className="text-lg text-white/70">{t("subtitle")}</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {(["all", "instagram", "facebook"] as const).map((f) => {
              const isActive = filter === f;
              const Icon = f === "instagram" ? Instagram : f === "facebook" ? Facebook : null;
              
              return (
                <motion.button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all backdrop-blur-sm ${
                    isActive
                      ? "bg-white/20 text-white shadow-lg border border-white/30"
                      : "bg-white/10 text-white/70 shadow-md border border-white/10 hover:bg-white/20 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {t(f)}
                </motion.button>
              );
            })}
          </div>

          <motion.button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/40 shadow-md backdrop-blur-sm border border-white/10"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <RefreshCcw className="h-4 w-4" />
            {t("refresh")}
          </motion.button>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visiblePosts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                onHoverStart={() => setHoveredId(post.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                <motion.div
                  className="group overflow-hidden rounded-2xl bg-white shadow-xl"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={post.imageUrl}
                      alt={t("socialPost")}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    {/* Colored overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${post.gradientClassName} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Platform badge */}
                    <motion.div
                      className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        {post.platform === "instagram" ? (
                          <Instagram className="h-4 w-4 text-pink-500" />
                        ) : (
                          <Facebook className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-xs font-medium text-slate-700">
                          {t(post.platform)}
                        </span>
                      </div>
                    </motion.div>

                    {/* Hover actions */}
                    <motion.div
                      className="absolute bottom-4 left-4 right-4 flex items-center justify-between"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: hoveredId === post.id ? 1 : 0,
                        y: hoveredId === post.id ? 0 : 20,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-4">
                        <motion.button
                          className="flex items-center gap-1 text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className="h-5 w-5" />
                          <span className="text-sm font-medium">
                            {post.likes.toLocaleString()}
                          </span>
                        </motion.button>
                        <motion.button
                          className="flex items-center gap-1 text-white"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">{post.comments}</span>
                        </motion.button>
                      </div>
                      <motion.button
                        className="text-white"
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Share2 className="h-5 w-5" />
                      </motion.button>
                    </motion.div>

                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: hoveredId === post.id ? "100%" : "-100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </section>
  );
}
