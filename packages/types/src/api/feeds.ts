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

export interface FeedExportItem {
  url: string;
  title: string;
  description: string | null;
  pollingIntervalSeconds: number;
  isActive: boolean;
}

export interface SettingsExport {
  version: number;
  feeds: FeedExportItem[];
  preference: {
    name: string;
    learningRate: number;
    vectors: { preference: number[]; shareable: number[]; knowledge: number[] };
  } | null;
}

export interface SettingsImportRequest {
  feeds?: Array<{
    url: string;
    title?: string;
    description?: string;
    pollingIntervalSeconds?: number;
  }>;
}

export interface SettingsImportResponse {
  added: number;
  skipped: number;
}

export interface FeedResponse {
  id: string;
  url: string;
  title: string;
  description: string | null;
  pollingIntervalSeconds: number;
  lastPolledAt: string | null;
  isActive: boolean;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}
