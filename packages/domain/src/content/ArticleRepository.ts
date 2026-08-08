import type { ArticleId, FeedId } from "../shared.ts";
import type { Article } from "./Article.ts";
import type { SourceType } from "./SourceType.ts";

export interface ArticleFilter {
  feedId?: FeedId;
  sourceType?: SourceType;
  limit?: number;
  offset?: number;
}

export interface ArticleRepository {
  findById(id: ArticleId): Promise<Article | null>;
  findByUrl(url: string): Promise<Article | null>;
  findMany(filter?: ArticleFilter): Promise<Article[]>;
  save(article: Article): Promise<void>;
  update(
    id: ArticleId,
    patch: Partial<Pick<Article, "summary" | "fullText" | "scrapedAt" | "wordCount">>,
  ): Promise<void>;
  existsByUrl(url: string): Promise<boolean>;
}
