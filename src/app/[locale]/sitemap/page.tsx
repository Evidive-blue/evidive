"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import {
  Home,
  MapPin,
  Building2,
  Shield,
  User,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SitemapSection {
  title: string;
  icon: React.ElementType;
  links: {
    label: string;
    href: string;
    description?: string;
  }[];
}

export default function SitemapPage() {
  const t = useTranslations("sitemap");
  const params = useParams();
  const locale = params.locale as string;

  const sections: SitemapSection[] = [
    {
      title: t("sections.main"),
      icon: Home,
      links: [
        { label: t("links.home"), href: "/", description: t("descriptions.home") },
        { label: t("links.about"), href: "/about", description: t("descriptions.about") },
        { label: t("links.contact"), href: "/contact", description: t("descriptions.contact") },
      ],
    },
    {
      title: t("sections.explore"),
      icon: MapPin,
      links: [
        { label: t("links.explorer"), href: "/explorer", description: t("descriptions.explorer") },
        { label: t("links.centers"), href: "/centers", description: t("descriptions.centers") },
      ],
    },
    {
      title: t("sections.account"),
      icon: User,
      links: [
        { label: t("links.login"), href: "/login", description: t("descriptions.login") },
        { label: t("links.register"), href: "/register", description: t("descriptions.register") },
        { label: t("links.dashboard"), href: "/dashboard", description: t("descriptions.dashboard") },
        { label: t("links.profile"), href: "/profile", description: t("descriptions.profile") },
        { label: t("links.settings"), href: "/settings", description: t("descriptions.settings") },
      ],
    },
    {
      title: t("sections.business"),
      icon: Building2,
      links: [
        { label: t("links.onboard"), href: "/onboard", description: t("descriptions.onboard") },
        { label: t("links.careers"), href: "/careers", description: t("descriptions.careers") },
      ],
    },
    {
      title: t("sections.legal"),
      icon: Shield,
      links: [
        { label: t("links.terms"), href: "/legal/terms", description: t("descriptions.terms") },
        { label: t("links.privacy"), href: "/legal/privacy", description: t("descriptions.privacy") },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            {t("title")}
          </h1>
          <p className="text-white/70">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Sitemap Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur-xl">
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <section.icon className="h-5 w-5 text-cyan-400" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="space-y-1">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-white/5"
                        >
                          <ChevronRight className="h-4 w-4 text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white/90 group-hover:text-cyan-400">
                              {link.label}
                            </p>
                            {link.description && (
                              <p className="text-xs text-white/50">
                                {link.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-white/50">
            {t("lastUpdated")}: {new Date().toLocaleDateString(locale)}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
