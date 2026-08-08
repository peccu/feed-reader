import type { ArticleId, CategoryId } from "../shared.ts";

export type AssignedBy = "manual" | "auto";

export interface ArticleCategory {
  readonly articleId: ArticleId;
  readonly categoryId: CategoryId;
  readonly assignedBy: AssignedBy;
  readonly assignedAt: Date;
}

export function createArticleCategory(
  articleId: ArticleId,
  categoryId: CategoryId,
  assignedBy: AssignedBy,
): ArticleCategory {
  return { articleId, categoryId, assignedBy, assignedAt: new Date() };
}
