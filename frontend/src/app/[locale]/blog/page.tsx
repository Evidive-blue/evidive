import { getTranslations } from "next-intl/server";
import { BlogClient } from "./blog-client";

export async function generateMetadata() {
  const t = await getTranslations("blog");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function BlogPage() {
  return <BlogClient />;
}
