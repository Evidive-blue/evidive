import { getTranslations } from "next-intl/server";
import { ContactClient } from "./contact-client";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">{t("title")}</h1>
        <p className="mb-12 max-w-2xl text-lg text-slate-300">{t("subtitle")}</p>
        <ContactClient />
      </div>
    </section>
  );
}
