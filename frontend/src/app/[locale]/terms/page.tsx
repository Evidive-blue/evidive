import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("terms");
  return {
    title: t("title"),
    description: t("intro"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("terms");

  const sections = [
    { title: t("section1Title"), content: t("section1") },
    { title: t("section2Title"), content: t("section2") },
    { title: t("section3Title"), content: t("section3") },
    { title: t("section4Title"), content: t("section4") },
    { title: t("section5Title"), content: t("section5") },
    { title: t("section6Title"), content: t("section6") },
  ];

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">{t("title")}</h1>
        <p className="mb-12 text-lg text-slate-300">{t("intro")}</p>
        <div className="space-y-10">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6"
            >
              <h2 className="mb-3 text-xl font-semibold text-cyan-200">
                {section.title}
              </h2>
              <p className="text-slate-300">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
