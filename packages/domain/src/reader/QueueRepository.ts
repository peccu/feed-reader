import type { ArticleId, QueueItemId } from "../shared.ts";
import type { QueueItem } from "./QueueItem.ts";
import type { QueueStatus } from "./QueueStatus.ts";

export interface QueueFilter {
  status?: QueueStatus;
  favorited?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: "relevance" | "addedAt";
}

export interface QueueRepository {
  findById(id: QueueItemId): Promise<QueueItem | null>;
  findByArticleId(articleId: ArticleId): Promise<QueueItem | null>;
  findMany(filter?: QueueFilter): Promise<QueueItem[]>;
  countByStatus(status: QueueStatus): Promise<number>;
  save(item: QueueItem): Promise<void>;
  updateStatus(id: QueueItemId, status: QueueStatus, readAt?: Date): Promise<void>;
  updateRelevanceScore(id: QueueItemId, score: number): Promise<void>;
  setFavorite(id: QueueItemId, favorited: boolean): Promise<void>;
}
