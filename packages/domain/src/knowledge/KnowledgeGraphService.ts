import type { ArticleId, CategoryId, NoteId } from "../shared.ts";

export interface KnowledgeGraphService {
  addArticleNode(articleId: ArticleId): Promise<void>;
  addNoteNode(noteId: NoteId, articleId: ArticleId): Promise<void>;
  assignCategory(articleId: ArticleId, categoryId: CategoryId): Promise<void>;
  removeCategory(articleId: ArticleId, categoryId: CategoryId): Promise<void>;
  findRelatedArticles(articleId: ArticleId, limit?: number): Promise<ArticleId[]>;
  findByCategory(categoryId: CategoryId, limit?: number): Promise<ArticleId[]>;
}
