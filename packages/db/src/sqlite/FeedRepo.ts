import type { Database } from "bun:sqlite";
import type { Feed, FeedId, FeedRepository } from "@feed-reader/domain";
import { FeedId as mkFeedId } from "@feed-reader/domain";
import { patchRow } from "./client.ts";

type FeedRow = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  polling_interval_seconds: number;
  last_polled_at: number | null;
  is_active: number;
  created_at: number;
  updated_at: number;
};

function toFeed(r: FeedRow): Feed {
  return {
    id: mkFeedId(r.id),
    url: r.url,
    title: r.title,
    description: r.description,
    pollingIntervalSeconds: r.polling_interval_seconds,
    lastPolledAt: r.last_polled_at !== null ? new Date(r.last_polled_at) : null,
    isActive: r.is_active === 1,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class FeedRepo implements FeedRepository {
  constructor(private readonly db: Database) {}

  async findById(id: FeedId): Promise<Feed | null> {
    const row =
      this.db.query<FeedRow, [string]>("SELECT * FROM feeds WHERE id = ?").get(id) ?? null;
    return row ? toFeed(row) : null;
  }

  async findAll(): Promise<Feed[]> {
    return this.db.query<FeedRow, []>("SELECT * FROM feeds").all().map(toFeed);
  }

  async findActive(): Promise<Feed[]> {
    return this.db.query<FeedRow, []>("SELECT * FROM feeds WHERE is_active = 1").all().map(toFeed);
  }

  async save(feed: Feed): Promise<void> {
    this.db.run(
      `INSERT INTO feeds
         (id, url, title, description, polling_interval_seconds, last_polled_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         url = excluded.url, title = excluded.title, description = excluded.description,
         polling_interval_seconds = excluded.polling_interval_seconds,
         last_polled_at = excluded.last_polled_at, is_active = excluded.is_active,
         updated_at = excluded.updated_at`,
      [
        feed.id,
        feed.url,
        feed.title,
        feed.description,
        feed.pollingIntervalSeconds,
        feed.lastPolledAt?.getTime() ?? null,
        feed.isActive ? 1 : 0,
        feed.createdAt.getTime(),
        feed.updatedAt.getTime(),
      ],
    );
  }

  async update(
    id: FeedId,
    patch: Partial<
      Pick<Feed, "title" | "description" | "pollingIntervalSeconds" | "lastPolledAt" | "isActive">
    >,
  ): Promise<void> {
    patchRow(this.db, "feeds", id, {
      title: patch.title,
      description: patch.description,
      polling_interval_seconds: patch.pollingIntervalSeconds,
      last_polled_at:
        patch.lastPolledAt !== undefined ? (patch.lastPolledAt?.getTime() ?? null) : undefined,
      is_active: patch.isActive !== undefined ? (patch.isActive ? 1 : 0) : undefined,
    });
  }

  async delete(id: FeedId): Promise<void> {
    this.db.run("DELETE FROM feeds WHERE id = ?", [id]);
  }
}
