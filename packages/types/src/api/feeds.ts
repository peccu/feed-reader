export interface CreateFeedRequest {
  url: string;
  title: string;
  description?: string;
  pollingIntervalSeconds?: number;
}

export interface UpdateFeedRequest {
  title?: string;
  description?: string;
  pollingIntervalSeconds?: number;
  isActive?: boolean;
}

export interface FeedResponse {
  id: string;
  url: string;
  title: string;
  description: string | null;
  pollingIntervalSeconds: number;
  lastPolledAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
