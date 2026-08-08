import type { FeedId } from "../shared.ts";

export interface Feed {
  readonly id: FeedId;
  readonly url: string;
  readonly title: string;
  readonly description: string | null;
  readonly pollingIntervalSeconds: number;
  readonly lastPolledAt: Date | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const MIN_POLLING_INTERVAL = 300;
const DEFAULT_POLLING_INTERVAL = 3600;

export interface CreateFeedInput {
  id: FeedId;
  url: string;
  title: string;
  description?: string;
  pollingIntervalSeconds?: number;
}

export function createFeed(input: CreateFeedInput): Feed {
  const interval = input.pollingIntervalSeconds ?? DEFAULT_POLLING_INTERVAL;
  if (interval < MIN_POLLING_INTERVAL) {
    throw new Error(`Polling interval must be at least ${MIN_POLLING_INTERVAL} seconds`);
  }
  const now = new Date();
  return {
    id: input.id,
    url: input.url,
    title: input.title,
    description: input.description ?? null,
    pollingIntervalSeconds: interval,
    lastPolledAt: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function isDueForPolling(feed: Feed, now: Date = new Date()): boolean {
  if (!feed.lastPolledAt) return true;
  const elapsed = (now.getTime() - feed.lastPolledAt.getTime()) / 1000;
  return elapsed >= feed.pollingIntervalSeconds;
}
