import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Instagram, Facebook, Linkedin } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/site-config";

export async function Footer() {
  const t = await getTranslations("footer");
  const tImages = await getTranslations("images");
  const tSocial = await getTranslations("social");

  const footerLinks = {
    discover: [
      { href: "/centers", label: t("destinations") },
      { href: "/centers?featured=true", label: t("offers") },
      { href: "/blog", label: t("blog") },
      { href: "/faq", label: t("faq") },
    ],
    company: [
      { href: "/about", label: t("about") },
      { href: "/contact", label: t("contact") },
      { href: "/careers", label: t("careers") },
      { href: "/partner", label: t("partner") },
    ],
    legal: [
      { href: "/terms", label: t("terms") },
      { href: "/privacy", label: t("privacy") },
      { href: "/sitemap", label: t("sitemap") },
    ],
  };

  return (
    <footer className="footer-ocean relative z-10">
      <div className="container-custom py-8 md:py-12 lg:py-16">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
          <div className="space-y-4">
            <Link href="/" className="navbar-logo inline-block">
              <Image
                src="/evidive-logo.png"
                alt={tImages("evidiveLogo")}
                width={120}
                height={36}
                sizes="(max-width: 640px) 96px, 120px"
                className="h-8 w-auto"
              />
            </Link>
            <p className="max-w-[280px] text-sm leading-relaxed text-slate-400/80 md:max-w-xs">{t("description")}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300 md:mb-4">{t("discover")}</h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300 md:mb-4">{t("company")}</h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300 md:mb-4">{t("legal")}</h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-cyan-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-ocean mt-8 md:mt-12" />
        <div className="pt-6 md:pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} {t("brandName")}. {t("rights")}
            </p>
            <div className="flex items-center gap-5">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-ocean text-slate-500 hover:text-pink-400"
                aria-label={tSocial("instagram")}
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-ocean text-slate-500 hover:text-blue-400"
                aria-label={tSocial("facebook")}
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-ocean text-slate-500 hover:text-sky-400"
                aria-label={tSocial("linkedin")}
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
            <p className="text-xs text-slate-600">
              {t("designedBy")}{" "}
              <a
                href="https://whytcard.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500/80 transition-colors hover:text-cyan-300"
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
