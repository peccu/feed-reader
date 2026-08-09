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
