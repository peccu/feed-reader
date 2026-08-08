import type { ArticleId } from "../shared.ts";
import type { Embedding } from "./Embedding.ts";

export interface SimilarArticle {
  readonly articleId: ArticleId;
  readonly similarity: number;
}

export interface EmbeddingRepository {
  findByArticleId(articleId: ArticleId): Promise<Embedding | null>;
  save(articleId: ArticleId, embedding: Embedding): Promise<void>;
  findSimilar(embedding: Embedding, limit?: number): Promise<SimilarArticle[]>;
}
