import type { Database } from "bun:sqlite";
import type {
  ArticleId,
  QueueFilter,
  QueueItem,
  QueueItemId,
  QueueRepository,
  QueueStatus,
} from "@feed-reader/domain";
import {
  createRelevanceScore,
  ArticleId as mkArticleId,
  QueueItemId as mkQueueItemId,
} from "@feed-reader/domain";

type QueueItemRow = {
  id: string;
  article_id: string;
  status: string;
  relevance_score: number;
  added_at: number;
  read_at: number | null;
};

function toItem(r: QueueItemRow): QueueItem {
  return {
    id: mkQueueItemId(r.id),
    articleId: mkArticleId(r.article_id),
    status: r.status as QueueStatus,
    relevanceScore: createRelevanceScore(r.relevance_score),
    addedAt: new Date(r.added_at),
    readAt: r.read_at !== null ? new Date(r.read_at) : null,
  };
}

export class QueueRepo implements QueueRepository {
  constructor(private readonly db: Database) {}

  async findById(id: QueueItemId): Promise<QueueItem | null> {
    const row =
      this.db.query<QueueItemRow, [string]>("SELECT * FROM queue_items WHERE id = ?").get(id) ??
      null;
    return row ? toItem(row) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<QueueItem | null> {
    const row =
      this.db
        .query<QueueItemRow, [string]>("SELECT * FROM queue_items WHERE article_id = ?")
        .get(articleId) ?? null;
    return row ? toItem(row) : null;
  }

  async findMany(filter?: QueueFilter): Promise<QueueItem[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (filter?.status) {
      conditions.push("status = ?");
      params.push(filter.status);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = filter?.sortBy === "relevance" ? "relevance_score DESC" : "added_at DESC";
    const limit = filter?.limit ? `LIMIT ${filter.limit}` : "";
    const offset = filter?.offset ? `OFFSET ${filter.offset}` : "";
    const sql = `SELECT * FROM queue_items ${where} ORDER BY ${orderBy} ${limit} ${offset}`.trim();
    return this.db
      .prepare<QueueItemRow, typeof params>(sql)
      .all(...params)
      .map(toItem);
  }

  async countByStatus(status: QueueStatus): Promise<number> {
    const row =
      this.db
        .query<{ count: number }, [string]>(
          "SELECT COUNT(*) as count FROM queue_items WHERE status = ?",
        )
        .get(status) ?? null;
    return row?.count ?? 0;
  }

  async save(item: QueueItem): Promise<void> {
    this.db.run(
      `INSERT INTO queue_items (id, article_id, status, relevance_score, added_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status, relevance_score = excluded.relevance_score,
         read_at = excluded.read_at`,
      [
        item.id,
        item.articleId,
        item.status,
        item.relevanceScore.value,
        item.addedAt.getTime(),
        item.readAt?.getTime() ?? null,
      ],
    );
  }

  async updateStatus(id: QueueItemId, status: QueueStatus, readAt?: Date): Promise<void> {
    this.db.run("UPDATE queue_items SET status = ?, read_at = ? WHERE id = ?", [
      status,
      readAt?.getTime() ?? null,
      id,
    ]);
  }

  async updateRelevanceScore(id: QueueItemId, score: number): Promise<void> {
    this.db.run("UPDATE queue_items SET relevance_score = ? WHERE id = ?", [score, id]);
  }
}
