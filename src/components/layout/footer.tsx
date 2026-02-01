"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { EviDiveLogo } from "@/components/ui/evidive-logo";

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer");

  const footerLinks = {
    discover: [
      { href: "/explorer", label: t("destinations") },
      { href: "/explorer?offers=true", label: t("offers") },
    ],
    company: [
      { href: "/about", label: t("about") },
      { href: "/contact", label: t("contact") },
      { href: "/careers", label: t("careers") },
    ],
    legal: [
      { href: "/conditions-generales", label: t("terms") },
      { href: "/privacy", label: t("privacy") },
      { href: "/sitemap", label: t("sitemap") },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/evidive", name: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/evidive", name: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/evidive", name: "Twitter" },
    { icon: Youtube, href: "https://youtube.com/evidive", name: "YouTube" },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block" aria-label="EviDive">
              <EviDiveLogo size="md" />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-white/60">
              {t("description")}
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Discover */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("discover")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("company")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("legal")}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} EviDive. {t("rights")}
            </p>
            <p className="text-sm text-white/40">
              Designed by{" "}
              <a
                href="https://whytcard.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                WhytCard
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
