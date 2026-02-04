'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Waves } from 'lucide-react';
import { useTranslations } from '@/lib/i18n/use-translations';
import { useZenStore } from '@/stores';

export function Footer() {
  const t = useTranslations('footer');
  const tImages = useTranslations('images');
  const tZen = useTranslations('zen');
  const openZen = useZenStore((state) => state.openZen);

  const footerLinks = {
    discover: [
      { href: '/centers', label: t('destinations') },
      { href: '/explorer', label: t('offers') },
    ],
    company: [
      { href: '/about', label: t('about') },
      { href: '/contact', label: t('contact') },
      { href: '/careers', label: t('careers') },
    ],
    legal: [
      { href: '/terms', label: t('terms') },
      { href: '/privacy', label: t('privacy') },
      { href: '/sitemap', label: t('sitemap') },
    ],
  };

  return (
    <footer className="border-t bg-card/50">
      <div className="container-custom py-12 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/evidive-logo.png"
                alt={tImages("evidiveLogo")}
                width={120}
                height={36}
                sizes="(max-width: 640px) 96px, 120px"
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('description')}
            </p>
          </div>

          {/* Discover */}
          <div>
            <h3 className="font-semibold mb-4">{t('discover')}</h3>
            <ul className="space-y-2">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{t('company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">{t('legal')}</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {t('brandName')}. {t('rights')}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={openZen}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors group"
                aria-label={tZen('zenMode')}
              >
                <Waves className="w-4 h-4 group-hover:animate-pulse" />
                <span>{tZen('zenMode')}</span>
              </button>
              <span className="text-muted-foreground/50">|</span>
              <p className="text-sm text-muted-foreground">
                Designed by{' '}
                <a
                  href="https://whytcard.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhytCard
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
