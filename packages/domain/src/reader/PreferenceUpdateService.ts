import type { ArticleId } from "../shared.ts";
import type { FeedbackType, VectorTarget } from "./FeedbackType.ts";

export interface PreferenceUpdateService {
  scheduleUpdate(articleId: ArticleId, feedbackType: FeedbackType, target: VectorTarget): void;
  flushPending(): Promise<void>;
}
