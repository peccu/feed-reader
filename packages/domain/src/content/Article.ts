import type { ArticleId, FeedId } from "../shared.ts";
import type { SourceType } from "./SourceType.ts";

/**
 * Version of the ingestion pipeline / data-acquisition method. Bump this
 * whenever the way we fetch or store article data changes so older rows can
 * be re-fetched (see scripts/reingest.ts).
 *   1 = plain-text body only
 *   2 = HTML body + lead/eyecatch image
 */
export const CURRENT_INGEST_VERSION = 2;

export interface Article {
  readonly id: ArticleId;
  readonly feedId: FeedId | null;
  readonly url: string;
  readonly title: string;
  readonly author: string | null;
  readonly fullText: string | null;
  /** Sanitizable HTML body from the source (RSS content / scraped article). */
  readonly html: string | null;
  /** Lead/eyecatch image URL, if the source provided one. */
  readonly leadImageUrl: string | null;
  readonly summary: string | null;
  readonly publishedAt: Date | null;
  readonly scrapedAt: Date | null;
  readonly sourceType: SourceType;
  readonly wordCount: number | null;
  /** Ingestion pipeline version that produced this row. */
  readonly ingestVersion: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateArticleInput {
  id: ArticleId;
  feedId?: FeedId;
  url: string;
  title: string;
  author?: string;
  fullText?: string;
  html?: string;
  leadImageUrl?: string;
  publishedAt?: Date;
  sourceType: SourceType;
  ingestVersion?: number;
}

export function createArticle(input: CreateArticleInput): Article {
  if (!input.url.startsWith("http://") && !input.url.startsWith("https://")) {
    throw new Error(`Invalid URL: ${input.url}`);
  }
  const now = new Date();
  const wordCount = input.fullText ? input.fullText.split(/\s+/).filter(Boolean).length : null;
  return {
    id: input.id,
    feedId: input.feedId ?? null,
    url: input.url,
    title: input.title,
    author: input.author ?? null,
    fullText: input.fullText ?? null,
    html: input.html ?? null,
    leadImageUrl: input.leadImageUrl ?? null,
    summary: null,
    publishedAt: input.publishedAt ?? null,
    scrapedAt: input.fullText ? now : null,
    sourceType: input.sourceType,
    wordCount,
    ingestVersion: input.ingestVersion ?? CURRENT_INGEST_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

/** エンベディング対象テキストを構築する */
export function buildEmbeddingText(article: Article): string {
  if (article.fullText) {
    return `${article.title}\n\n${article.fullText}`;
  }
  return article.title;
}
