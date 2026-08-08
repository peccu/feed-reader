import type { ArticleId, FeedbackId } from "../shared.ts";
import type { FeedbackType, VectorTarget } from "./FeedbackType.ts";

export interface Feedback {
  readonly id: FeedbackId;
  readonly articleId: ArticleId;
  readonly feedbackType: FeedbackType;
  readonly vectorTarget: VectorTarget;
  readonly createdAt: Date;
}

export interface CreateFeedbackInput {
  id: FeedbackId;
  articleId: ArticleId;
  feedbackType: FeedbackType;
  vectorTarget: VectorTarget;
}

export function createFeedback(input: CreateFeedbackInput): Feedback {
  return { ...input, createdAt: new Date() };
}
