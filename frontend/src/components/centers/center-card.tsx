"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { MapPin, Star, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicCenter } from "@/lib/api";

interface CenterCardProps {
  center: PublicCenter;
  index: number;
}

export function CenterCard({ center, index }: CenterCardProps) {
  const t = useTranslations("centers.directory");
  const name = center.display_name || center.name;
  const href = center.slug ? `/centers/${center.slug}` : `/centers/${center.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24, delay: index * 0.05 }}
    >
      <Link href={href}>
        <article className="glass-ocean group overflow-hidden rounded-2xl transition-all duration-300">
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-cyan-900/50 to-slate-900">
            {center.cover_url ? (
              <Image
                src={center.cover_url}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-5xl opacity-30">🤿</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {center.verified && (
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm">
                <Check className="h-3 w-3" />
                {t("verified")}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="mb-2 line-clamp-1 font-semibold text-white transition-colors group-hover:text-cyan-300">
              {name}
            </h3>
            <div className="mb-2 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-500/70" />
              <span className="line-clamp-1">
                {[center.city, center.country].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <p className="mb-3 flex items-center gap-1 text-sm text-slate-400">
              <Star className={`h-3.5 w-3.5 shrink-0 ${(center.average_rating ?? 0) > 0 ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
              {t("rating", {
                rating: center.average_rating?.toFixed(1) ?? "—",
                count: center.review_count ?? 0,
              })}
            </p>
            {center.description && (
              <p className="line-clamp-2 text-sm text-slate-400">
                {center.description}
              </p>
            )}
            <span className="mt-3 inline-block text-sm text-cyan-400 transition-colors group-hover:text-cyan-300">
              {t("viewCenter")} →
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
