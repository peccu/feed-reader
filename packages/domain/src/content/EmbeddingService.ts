import type { Article } from "./Article.ts";
import type { Embedding } from "./Embedding.ts";

export interface EmbeddingService {
  embed(text: string): Promise<Embedding>;
  embedArticle(article: Article): Promise<Embedding>;
}
