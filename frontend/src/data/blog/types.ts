import type { Locale } from "@/i18n/routing";

export type BlogCategory = "destinations" | "tips";

export interface BlogLocalizedContent {
  title: string;
  excerpt: string;
  body: string; // Markdown content
}

export interface BlogArticle {
  slug: string;
  date: string; // ISO date string
  category: BlogCategory;
  readingTime: number; // minutes
  image: string; // path or URL
  content: Record<Locale, BlogLocalizedContent>;
}
