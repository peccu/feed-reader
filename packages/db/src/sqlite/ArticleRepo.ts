import type { Database } from "bun:sqlite";
import type { Article, ArticleFilter, ArticleId, ArticleRepository } from "@feed-reader/domain";
import { ArticleId as mkArticleId, FeedId as mkFeedId } from "@feed-reader/domain";
import type { SourceType } from "@feed-reader/domain";
import { patchRow } from "./client.ts";

type ArticleRow = {
  id: string;
  feed_id: string | null;
  url: string;
  title: string;
  author: string | null;
  full_text: string | null;
  html: string | null;
  lead_image_url: string | null;
  summary: string | null;
  published_at: number | null;
  scraped_at: number | null;
  source_type: string;
  word_count: number | null;
  ingest_version: number;
  created_at: number;
  updated_at: number;
};

function toArticle(r: ArticleRow): Article {
  return {
    id: mkArticleId(r.id),
    feedId: r.feed_id ? mkFeedId(r.feed_id) : null,
    url: r.url,
    title: r.title,
    author: r.author,
    fullText: r.full_text,
    html: r.html,
    leadImageUrl: r.lead_image_url,
    summary: r.summary,
    publishedAt: r.published_at !== null ? new Date(r.published_at) : null,
    scrapedAt: r.scraped_at !== null ? new Date(r.scraped_at) : null,
    sourceType: r.source_type as SourceType,
    wordCount: r.word_count,
    ingestVersion: r.ingest_version ?? 0,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class ArticleRepo implements ArticleRepository {
  constructor(private readonly db: Database) {}

  async findById(id: ArticleId): Promise<Article | null> {
    const row =
      this.db.query<ArticleRow, [string]>("SELECT * FROM articles WHERE id = ?").get(id) ?? null;
    return row ? toArticle(row) : null;
  }

  async findByUrl(url: string): Promise<Article | null> {
    const row =
      this.db.query<ArticleRow, [string]>("SELECT * FROM articles WHERE url = ?").get(url) ?? null;
    return row ? toArticle(row) : null;
  }

  async findMany(filter?: ArticleFilter): Promise<Article[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (filter?.feedId) {
      conditions.push("feed_id = ?");
      params.push(filter.feedId);
    }
    if (filter?.sourceType) {
      conditions.push("source_type = ?");
      params.push(filter.sourceType);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filter?.limit ? `LIMIT ${filter.limit}` : "";
    const offset = filter?.offset ? `OFFSET ${filter.offset}` : "";
    const sql =
      `SELECT * FROM articles ${where} ORDER BY created_at DESC ${limit} ${offset}`.trim();
    return this.db
      .prepare<ArticleRow, typeof params>(sql)
      .all(...params)
      .map(toArticle);
  }

  async save(article: Article): Promise<void> {
    this.db.run(
      `INSERT INTO articles
         (id, feed_id, url, title, author, full_text, html, lead_image_url, summary,
          published_at, scraped_at, source_type, word_count, ingest_version,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         feed_id = excluded.feed_id, title = excluded.title, author = excluded.author,
         full_text = excluded.full_text, html = excluded.html,
         lead_image_url = excluded.lead_image_url, summary = excluded.summary,
         published_at = excluded.published_at, scraped_at = excluded.scraped_at,
         word_count = excluded.word_count, ingest_version = excluded.ingest_version,
         updated_at = excluded.updated_at`,
      [
        article.id,
        article.feedId,
        article.url,
        article.title,
        article.author,
        article.fullText,
        article.html,
        article.leadImageUrl,
        article.summary,
        article.publishedAt?.getTime() ?? null,
        article.scrapedAt?.getTime() ?? null,
        article.sourceType,
        article.wordCount,
        article.ingestVersion,
        article.createdAt.getTime(),
        article.updatedAt.getTime(),
      ],
    );
  }

  async update(
    id: ArticleId,
    patch: Partial<Pick<Article, "summary" | "fullText" | "scrapedAt" | "wordCount">>,
  ): Promise<void> {
    patchRow(this.db, "articles", id, {
      summary: patch.summary,
      full_text: patch.fullText,
      scraped_at: patch.scrapedAt !== undefined ? (patch.scrapedAt?.getTime() ?? null) : undefined,
      word_count: patch.wordCount,
    });
  }

  async existsByUrl(url: string): Promise<boolean> {
    const row =
      this.db
        .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM articles WHERE url = ?")
        .get(url) ?? null;
    return (row?.count ?? 0) > 0;
  }
}
