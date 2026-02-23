import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getArticleBySlug, getAllSlugs, getLocalizedArticle } from "@/data/blog";
import type { Locale } from "@/i18n/routing";
import { ArticleClient } from "./article-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("blog");
  const locale = (await getLocale()) as Locale;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: t("pageTitle") };
  }

  const content = getLocalizedArticle(article, locale);
  return {
    title: content.title,
    description: content.excerpt,
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  return <ArticleClient article={article} />;
}
