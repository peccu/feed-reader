import type { ArticleId, CategoryId } from "../shared.ts";
import type { ArticleCategory } from "./ArticleCategory.ts";

export interface ArticleCategoryRepository {
  findByArticleId(articleId: ArticleId): Promise<ArticleCategory[]>;
  findByCategoryId(categoryId: CategoryId): Promise<ArticleCategory[]>;
  assign(ac: ArticleCategory): Promise<void>;
  unassign(articleId: ArticleId, categoryId: CategoryId): Promise<void>;
}
