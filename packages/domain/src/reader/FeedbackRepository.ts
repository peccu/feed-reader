import type { ArticleId, FeedbackId } from "../shared.ts";
import type { Feedback } from "./Feedback.ts";
import type { VectorTarget } from "./FeedbackType.ts";

export interface FeedbackRepository {
  findById(id: FeedbackId): Promise<Feedback | null>;
  findByArticleId(articleId: ArticleId): Promise<Feedback[]>;
  findUnappliedFor(target: VectorTarget): Promise<Feedback[]>;
  save(feedback: Feedback): Promise<void>;
  markApplied(ids: FeedbackId[]): Promise<void>;
  deleteByArticle(articleId: ArticleId): Promise<void>;
}
