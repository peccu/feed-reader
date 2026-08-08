import type { Database } from "bun:sqlite";
import type {
  ArticleCategory,
  ArticleCategoryRepository,
  ArticleId,
  AssignedBy,
  CategoryId,
} from "@feed-reader/domain";
import { ArticleId as mkArticleId, CategoryId as mkCategoryId } from "@feed-reader/domain";

type ArticleCategoryRow = {
  article_id: string;
  category_id: string;
  assigned_by: string;
  assigned_at: number;
};

function toAC(r: ArticleCategoryRow): ArticleCategory {
  return {
    articleId: mkArticleId(r.article_id),
    categoryId: mkCategoryId(r.category_id),
    assignedBy: r.assigned_by as AssignedBy,
    assignedAt: new Date(r.assigned_at),
  };
}

export class ArticleCategoryRepo implements ArticleCategoryRepository {
  constructor(private readonly db: Database) {}

  async findByArticleId(articleId: ArticleId): Promise<ArticleCategory[]> {
    return this.db
      .query<ArticleCategoryRow, [string]>("SELECT * FROM article_categories WHERE article_id = ?")
      .all(articleId)
      .map(toAC);
  }

  async findByCategoryId(categoryId: CategoryId): Promise<ArticleCategory[]> {
    return this.db
      .query<ArticleCategoryRow, [string]>("SELECT * FROM article_categories WHERE category_id = ?")
      .all(categoryId)
      .map(toAC);
  }

  async assign(ac: ArticleCategory): Promise<void> {
    this.db.run(
      `INSERT INTO article_categories (article_id, category_id, assigned_by, assigned_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(article_id, category_id) DO UPDATE SET
         assigned_by = excluded.assigned_by, assigned_at = excluded.assigned_at`,
      [ac.articleId, ac.categoryId, ac.assignedBy, ac.assignedAt.getTime()],
    );
  }

  async unassign(articleId: ArticleId, categoryId: CategoryId): Promise<void> {
    this.db.run("DELETE FROM article_categories WHERE article_id = ? AND category_id = ?", [
      articleId,
      categoryId,
    ]);
  }
}
