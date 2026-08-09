export interface AdminStatsResponse {
  articles: number;
  feeds: number;
  notes: number;
  categories: number;
  queue: {
    unread: number;
    reading: number;
    read: number;
    skipped: number;
    archived: number;
  };
  pendingJobs: {
    pending: number;
    processing: number;
    done: number;
    failed: number;
  };
  feedback: {
    like: number;
    dislike: number;
  };
}

export interface PendingJobResponse {
  id: string;
  jobType: string;
  status: string;
  payload: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHealthResponse {
  name: string;
  status: "up" | "down" | "unknown";
  detail: string | null;
}

/** Like/dislike counts aggregated by the source domain (article host). */
export interface FeedbackByDomainItem {
  host: string;
  like: number;
  dislike: number;
  total: number;
}

export interface FeedbackByDomainResponse {
  items: FeedbackByDomainItem[];
}

export interface DebugQueryRequest {
  sql: string;
}

export interface DebugQueryResponse {
  columns: string[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
}
