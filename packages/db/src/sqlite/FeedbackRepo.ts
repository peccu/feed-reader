import type { Database } from "bun:sqlite";
import type {
  ArticleId,
  Feedback,
  FeedbackId,
  FeedbackRepository,
  FeedbackType,
  VectorTarget,
} from "@feed-reader/domain";
import { ArticleId as mkArticleId, FeedbackId as mkFeedbackId } from "@feed-reader/domain";

type FeedbackRow = {
  id: string;
  article_id: string;
  feedback_type: string;
  vector_target: string;
  applied: number;
  created_at: number;
};

function toFeedback(r: FeedbackRow): Feedback {
  return {
    id: mkFeedbackId(r.id),
    articleId: mkArticleId(r.article_id),
    feedbackType: r.feedback_type as FeedbackType,
    vectorTarget: r.vector_target as VectorTarget,
    createdAt: new Date(r.created_at),
  };
}

export class FeedbackRepo implements FeedbackRepository {
  constructor(private readonly db: Database) {}

  async findById(id: FeedbackId): Promise<Feedback | null> {
    const row =
      this.db.query<FeedbackRow, [string]>("SELECT * FROM feedback WHERE id = ?").get(id) ?? null;
    return row ? toFeedback(row) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<Feedback[]> {
    return this.db
      .query<FeedbackRow, [string]>("SELECT * FROM feedback WHERE article_id = ?")
      .all(articleId)
      .map(toFeedback);
  }

  async findUnappliedFor(target: VectorTarget): Promise<Feedback[]> {
    return this.db
      .query<FeedbackRow, [string]>(
        "SELECT * FROM feedback WHERE applied = 0 AND vector_target = ? ORDER BY created_at ASC",
      )
      .all(target)
      .map(toFeedback);
  }

  async save(feedback: Feedback): Promise<void> {
    this.db.run(
      `INSERT INTO feedback (id, article_id, feedback_type, vector_target, applied, created_at)
       VALUES (?, ?, ?, ?, 0, ?)
       ON CONFLICT(id) DO NOTHING`,
      [
        feedback.id,
        feedback.articleId,
        feedback.feedbackType,
        feedback.vectorTarget,
        feedback.createdAt.getTime(),
      ],
    );
  }

  async markApplied(ids: FeedbackId[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(", ");
    this.db.run(`UPDATE feedback SET applied = 1 WHERE id IN (${placeholders})`, ids as string[]);
  }

  async deleteByArticle(articleId: ArticleId): Promise<void> {
    this.db.run("DELETE FROM feedback WHERE article_id = ?", [articleId]);
  }
}
