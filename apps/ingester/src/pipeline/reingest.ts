import { type ArticleId, createArticle } from "@feed-reader/domain";
import Parser from "@postlight/parser";
import { articleRepo, embeddingRepo } from "../db.ts";
import { buildEmbeddingInput, firstImageSrc, parseHtml } from "./htmlParser.ts";
import { embed } from "./jinaEmbedder.ts";

/**
 * Re-fetch an already-stored article in place: refresh HTML/lead image/text and
 * re-embed, keeping the same article id (so its queue item and category links
 * survive) and bumping it to the current ingest version. Used by scripts/reingest.ts.
 */
export async function reingestArticle(
  articleId: ArticleId,
): Promise<{ ok: boolean; reason?: string }> {
  const existing = await articleRepo.findById(articleId);
  if (!existing) return { ok: false, reason: "not found" };

  let title = existing.title;
  let html: string | undefined;
  let author: string | undefined = existing.author ?? undefined;
  let publishedAt: Date | undefined = existing.publishedAt ?? undefined;
  let leadImageUrl: string | undefined;

  try {
    const scraped = await Parser.parse(existing.url, { contentType: "html" });
    if (scraped.title) title = scraped.title;
    if (scraped.author) author = scraped.author;
    if (scraped.date_published) publishedAt = new Date(scraped.date_published);
    if (scraped.content) html = scraped.content;
    if (scraped.lead_image_url) leadImageUrl = scraped.lead_image_url;
  } catch (err) {
    console.warn(`[reingest] scrape failed for ${existing.url}:`, err);
  }

  const parsed = html ? parseHtml(html) : null;
  if (!leadImageUrl && html) leadImageUrl = firstImageSrc(html);

  // Re-embed against the refreshed text.
  const embeddingInput = parsed ? buildEmbeddingInput(parsed) : title;
  let embedding: Awaited<ReturnType<typeof embed>> | null = null;
  try {
    embedding = await embed(embeddingInput);
  } catch (err) {
    console.error(`[reingest] embedding failed for ${existing.url}:`, err);
  }
  if (embedding) await embeddingRepo.save(articleId, embedding);

  // Upsert in place (same id → keeps queue item, embeddings, category links).
  const updated = createArticle({
    id: articleId,
    url: existing.url,
    title,
    sourceType: existing.sourceType,
    ...(existing.feedId ? { feedId: existing.feedId } : {}),
    ...(author != null ? { author } : {}),
    ...(parsed?.text != null ? { fullText: parsed.text } : {}),
    ...(html != null ? { html } : {}),
    ...(leadImageUrl != null ? { leadImageUrl } : {}),
    ...(publishedAt != null ? { publishedAt } : {}),
  });
  await articleRepo.save(updated);
  return { ok: true };
}
