import type { FeedId } from "../shared.ts";
import type { Feed } from "./Feed.ts";

export interface FeedRepository {
  findById(id: FeedId): Promise<Feed | null>;
  findAll(): Promise<Feed[]>;
  findActive(): Promise<Feed[]>;
  save(feed: Feed): Promise<void>;
  update(
    id: FeedId,
    patch: Partial<
      Pick<Feed, "title" | "description" | "pollingIntervalSeconds" | "lastPolledAt" | "isActive">
    >,
  ): Promise<void>;
  delete(id: FeedId): Promise<void>;
}
