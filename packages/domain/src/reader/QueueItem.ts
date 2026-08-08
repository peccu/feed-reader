import type { ArticleId, QueueItemId } from "../shared.ts";
import { canTransitionTo } from "./QueueStatus.ts";
import type { QueueStatus } from "./QueueStatus.ts";
import type { RelevanceScore } from "./RelevanceScore.ts";

export interface QueueItem {
  readonly id: QueueItemId;
  readonly articleId: ArticleId;
  readonly status: QueueStatus;
  readonly relevanceScore: RelevanceScore;
  readonly addedAt: Date;
  readonly readAt: Date | null;
}

export interface CreateQueueItemInput {
  id: QueueItemId;
  articleId: ArticleId;
  relevanceScore: RelevanceScore;
}

export function createQueueItem(input: CreateQueueItemInput): QueueItem {
  return {
    id: input.id,
    articleId: input.articleId,
    status: "unread",
    relevanceScore: input.relevanceScore,
    addedAt: new Date(),
    readAt: null,
  };
}

export function transitionStatus(item: QueueItem, next: QueueStatus): QueueItem {
  if (!canTransitionTo(item.status, next)) {
    throw new Error(`Cannot transition from ${item.status} to ${next}`);
  }
  return {
    ...item,
    status: next,
    readAt: next === "read" ? new Date() : item.readAt,
  };
}
