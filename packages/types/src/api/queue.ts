export interface QueueListQuery {
  status?: string;
  sort?: "relevance" | "added_at";
  limit?: number;
}

export interface UpdateQueueStatusRequest {
  status: "reading" | "read" | "skipped" | "archived" | "unread";
}

export interface QueueItemResponse {
  id: string;
  articleId: string;
  status: string;
  relevanceScore: number;
  addedAt: string;
  readAt: string | null;
}

export interface QueueStatsResponse {
  unread: number;
  reading: number;
  read: number;
  skipped: number;
  archived: number;
}
