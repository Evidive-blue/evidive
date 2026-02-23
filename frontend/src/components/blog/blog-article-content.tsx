"use client";

interface BlogArticleContentProps {
  /** Markdown body of the article */
  body: string;
}

/**
 * Lightweight Markdown renderer for blog article bodies.
 * Supports: ## headings, **bold**, paragraphs, and links.
 * No external dependency required for the subset of Markdown we use.
 *
 * SECURITY: dangerouslySetInnerHTML is safe here because:
 * 1. All raw text is escaped via escapeHtml() (prevents injection of HTML/script tags)
 * 2. Only controlled HTML tags are introduced by markdownToHtml (h2, h3, p, strong, a)
 * 3. Link href values are validated to start with https://, http://, or / (no javascript: URIs)
 * 4. Content source is the CMS backend (admin-authored), not user-submitted
 */
export function BlogArticleContent({ body }: BlogArticleContentProps) {
  const html = markdownToHtml(body);

  return (
    <div
      className="prose-ocean"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Escape HTML entities to prevent XSS, even though content is static. */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownToHtml(md: string): string {
  return md
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return "";
      }

      // ## Heading
      if (trimmed.startsWith("## ")) {
        const text = inlineFormat(escapeHtml(trimmed.slice(3)));
        return `<h2>${text}</h2>`;
      }
      // ### Heading
      if (trimmed.startsWith("### ")) {
        const text = inlineFormat(escapeHtml(trimmed.slice(4)));
        return `<h3>${text}</h3>`;
      }

      // Paragraph
      return `<p>${inlineFormat(escapeHtml(trimmed))}</p>`;
    })
    .join("");
}

function inlineFormat(text: string): string {
  // **bold** (entities already escaped, so * chars are safe to match)
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // [link text](url) — validate href starts with https:// or /
  result = result.replace(
    /\[(.+?)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return result;
}
