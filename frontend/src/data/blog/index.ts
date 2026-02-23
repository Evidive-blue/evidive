import type { BlogArticle, BlogCategory } from "./types";
import type { Locale } from "@/i18n/routing";

import { article as divingElbaIsland } from "./diving-elba-island";
import { article as divingTuscany } from "./diving-tuscany";
import { article as divingSardinia } from "./diving-sardinia";
import { article as divingSicily } from "./diving-sicily";
import { article as diverEssentialsPacking } from "./diver-essentials-packing";
import { article as whyBookDivesOnline } from "./why-book-dives-online";
import { article as diveCenterSafety } from "./dive-center-safety";
import { article as bestDivingDestinations } from "./best-diving-destinations";

/** All blog articles sorted by date (newest first) */
export const allArticles: BlogArticle[] = [
  divingElbaIsland,
  divingTuscany,
  divingSardinia,
  divingSicily,
  diverEssentialsPacking,
  diveCenterSafety,
  whyBookDivesOnline,
  bestDivingDestinations,
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/** Get a single article by slug */
export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return allArticles.find((a) => a.slug === slug);
}

/** Get all articles of a given category */
export function getArticlesByCategory(category: BlogCategory): BlogArticle[] {
  return allArticles.filter((a) => a.category === category);
}

/** Get localized content for an article */
export function getLocalizedArticle(
  article: BlogArticle,
  locale: Locale,
): { title: string; excerpt: string; body: string } {
  return article.content[locale] ?? article.content.en;
}

/** Get all unique slugs (for generateStaticParams) */
export function getAllSlugs(): string[] {
  return allArticles.map((a) => a.slug);
}

export type { BlogArticle, BlogCategory } from "./types";
