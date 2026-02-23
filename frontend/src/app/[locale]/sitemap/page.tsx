import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata() {
  const t = await getTranslations("sitemap");
  return {
    title: t("title"),
  };
}

export default async function SitemapPage() {
  const t = await getTranslations("sitemap");

  const mainLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/centers", label: t("centers") },
    { href: "/contact", label: t("contact") },
    { href: "/careers", label: t("careers") },
    { href: "/login", label: t("login") },
    { href: "/register", label: t("register") },
    { href: "/onboard/center", label: t("registerCenter") },
  ];

  const legalLinks = [
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
  ];

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-12 text-2xl font-bold text-white md:text-3xl lg:text-4xl">{t("title")}</h1>

        <div className="space-y-10">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-cyan-200">
              {t("mainNav")}
            </h2>
            <ul className="space-y-2">
              {mainLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-300 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-cyan-200">
              {t("legal")}
            </h2>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-300 transition-colors hover:text-cyan-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
