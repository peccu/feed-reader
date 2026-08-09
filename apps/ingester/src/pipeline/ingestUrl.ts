import {
  ArticleId,
  QueueItemId,
  createArticle,
  createQueueItem,
  createRelevanceScore,
} from "@feed-reader/domain";
import type { FeedId } from "@feed-reader/domain";
import Parser from "@postlight/parser";
import { articleRepo, embeddingRepo, preferenceRepo, queueRepo } from "../db.ts";
import { enrichWithClaude } from "./claudeEnricher.ts";
import { buildEmbeddingInput, parseHtml } from "./htmlParser.ts";
import { embed } from "./jinaEmbedder.ts";

export interface IngestResult {
  articleId: string;
  skipped: boolean;
  reason?: string;
}

/**
 * Full ingestion pipeline for a single URL:
 * 1. Dedup check
 * 2. @postlight/parser scraping
 * 3. HTML parsing + link extraction
 * 4. Optional Claude keyword enrichment
 * 5. Jina embedding
 * 6. Save article + embedding
 * 7. Score against preference vector
 * 8. Enqueue as unread
 */
export async function ingestUrl(
  url: string,
  options: { feedId?: FeedId; overrideTitle?: string } = {},
): Promise<IngestResult> {
  // 1. Dedup
  if (await articleRepo.existsByUrl(url)) {
    return { articleId: "", skipped: true, reason: "already exists" };
  }

  const articleId = ArticleId(crypto.randomUUID());

  let title = options.overrideTitle ?? url;
  let fullText: string | undefined;
  let author: string | undefined;
  let publishedAt: Date | undefined;

  // 2. Scrape with @postlight/parser
  try {
    const parsed = await Parser.parse(url, { contentType: "text" });
    if (parsed.title) title = parsed.title;
    if (parsed.author) author = parsed.author;
    if (parsed.date_published) publishedAt = new Date(parsed.date_published);
    if (parsed.content) fullText = parsed.content;
  } catch (err) {
    console.warn(`[ingester] scrape failed for ${url}:`, err);
  }

  // 3. Parse HTML → clean text + links
  const parsed = fullText ? parseHtml(fullText) : null;
  const cleanText = parsed?.text ?? title;

  // 4. Optional Claude enrichment (keywords/categories)
  const enriched = await enrichWithClaude(articleId, cleanText);

  // 5. Embed — use clean text with link context
  const embeddingInput = parsed ? buildEmbeddingInput(parsed) : title;

  let embedding: Awaited<ReturnType<typeof embed>> | null = null;
  try {
    embedding = await embed(embeddingInput);
  } catch (err) {
    console.error(`[ingester] embedding failed for ${url}:`, err);
  }

  // 6. Save article
  const article = createArticle({
    id: articleId,
    url,
    title,
    sourceType: options.feedId ? "rss" : "url",
    ...(options.feedId ? { feedId: options.feedId } : {}),
    ...(author != null ? { author } : {}),
    ...(parsed?.text != null ? { fullText: parsed.text } : {}),
    ...(publishedAt != null ? { publishedAt } : {}),
  });
  await articleRepo.save(article);

  // 7. Save embedding if successful
  if (embedding) {
    await embeddingRepo.save(articleId, embedding);
  }

  // 8. Score against preference profile and enqueue
  const profile = await preferenceRepo.findDefault();
  let score = 0;
  if (profile && embedding) {
    // Cosine similarity between article embedding and preference vector
    const pref = profile.vectors.preference;
    const vec = embedding.vector;
    let dot = 0;
    let normP = 0;
    let normV = 0;
    for (let i = 0; i < pref.length; i++) {
      dot += (pref[i] ?? 0) * (vec[i] ?? 0);
      normP += (pref[i] ?? 0) ** 2;
      normV += (vec[i] ?? 0) ** 2;
    }
    const normVal = Math.sqrt(normP) * Math.sqrt(normV);
    score = normVal > 0 ? dot / normVal : 0;
  }

  const queueItem = createQueueItem({
    id: QueueItemId(crypto.randomUUID()),
    articleId,
    relevanceScore: createRelevanceScore(Math.max(0, Math.min(1, score))),
  });
  await queueRepo.save(queueItem);

  if (enriched.keywords.length > 0) {
    console.log(`[ingester] keywords for ${url}: ${enriched.keywords.join(", ")}`);
  }

  return { articleId, skipped: false };
}
