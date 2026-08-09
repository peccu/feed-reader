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
  favorited: boolean;
  addedAt: string;
  readAt: string | null;
}

export interface UpdateFavoriteRequest {
  favorited: boolean;
}

/** Queue item enriched with article info, for list/library screens. */
export interface QueueListItemResponse {
  id: string;
  articleId: string;
  status: string;
  relevanceScore: number;
  favorited: boolean;
  addedAt: string;
  readAt: string | null;
  title: string;
  url: string;
  leadImageUrl: string | null;
  publishedAt: string | null;
  /** Latest like/dislike feedback for the article, if any. */
  feedback: "like" | "dislike" | null;
  /** Whether the article has any note. */
  hasNote: boolean;
}

export interface QueueStatsResponse {
  unread: number;
  reading: number;
  read: number;
  skipped: number;
  archived: number;
}
