export interface ParsedContent {
  text: string;
  links: Array<{ href: string; text: string }>;
  wordCount: number;
}

/** Strip HTML tags and extract meaningful text and links. */
export function parseHtml(html: string): ParsedContent {
  const links: Array<{ href: string; text: string }> = [];

  // Extract links with their text before stripping tags
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(linkRe)) {
    const href = m[1]?.trim() ?? "";
    const linkText = (m[2] ?? "").replace(/<[^>]*>/g, "").trim();
    if (href && linkText && href.startsWith("http")) {
      links.push({ href, text: linkText });
    }
  }

  // Strip all remaining HTML tags
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, links, wordCount };
}

/** Append link metadata to text so embeddings capture link context. */
export function buildEmbeddingInput(content: ParsedContent, maxWords = 4000): string {
  const words = content.text.split(/\s+/);
  const mainText = words.slice(0, maxWords).join(" ");

  if (content.links.length === 0) return mainText;

  const linkMeta = content.links
    .slice(0, 20) // cap at 20 links to avoid bloat
    .map((l) => `[${l.text}]`)
    .join(", ");

  return `${mainText}\n\nLinks: ${linkMeta}`;
}
