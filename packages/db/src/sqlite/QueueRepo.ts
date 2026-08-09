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
  favorited: number;
  added_at: number;
  read_at: number | null;
};

function toItem(r: QueueItemRow): QueueItem {
  return {
    id: mkQueueItemId(r.id),
    articleId: mkArticleId(r.article_id),
    status: r.status as QueueStatus,
    relevanceScore: createRelevanceScore(r.relevance_score),
    favorited: r.favorited === 1,
    addedAt: new Date(r.added_at),
    readAt: r.read_at !== null ? new Date(r.read_at) : null,
  };
}

/** Read model for list/library views: a queue item joined with article info. */
export interface QueueListItem {
  item: QueueItem;
  title: string;
  url: string;
  leadImageUrl: string | null;
  publishedAt: Date | null;
  feedback: "like" | "dislike" | null;
  hasNote: boolean;
}

type QueueListRow = QueueItemRow & {
  title: string;
  url: string;
  lead_image_url: string | null;
  published_at: number | null;
  feedback: string | null;
  has_note: number;
};

// Shared SELECT: queue item + article info + latest feedback + note flag.
const LIST_SELECT = `q.*, a.title, a.url, a.lead_image_url, a.published_at,
  (SELECT f.feedback_type FROM feedback f WHERE f.article_id = a.id
   ORDER BY f.created_at DESC LIMIT 1) AS feedback,
  EXISTS(SELECT 1 FROM notes n WHERE n.article_id = a.id) AS has_note`;

function toListItem(r: QueueListRow): QueueListItem {
  return {
    item: toItem(r),
    title: r.title,
    url: r.url,
    leadImageUrl: r.lead_image_url,
    publishedAt: r.published_at !== null ? new Date(r.published_at) : null,
    feedback: r.feedback === "like" || r.feedback === "dislike" ? r.feedback : null,
    hasNote: r.has_note === 1,
  };
}

export class QueueRepo implements QueueRepository {
  constructor(private readonly db: Database) {}

  /** Queue items joined with their article, for list/library screens. */
  async findListView(filter?: QueueFilter): Promise<QueueListItem[]> {
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (filter?.status) {
      conditions.push("q.status = ?");
      params.push(filter.status);
    }
    if (filter?.favorited !== undefined) {
      conditions.push("q.favorited = ?");
      params.push(filter.favorited ? 1 : 0);
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = filter?.sortBy === "relevance" ? "q.relevance_score DESC" : "q.added_at DESC";
    const limit = filter?.limit ? `LIMIT ${filter.limit}` : "";
    const sql = `SELECT ${LIST_SELECT}
       FROM queue_items q JOIN articles a ON a.id = q.article_id
       ${where} ORDER BY ${orderBy} ${limit}`.trim();
    return this.db
      .prepare<QueueListRow, typeof params>(sql)
      .all(...params)
      .map(toListItem);
  }

  /**
   * Unread items whose relevance score is closest to the 0.5 decision
   * boundary — the "borderline" articles most useful for training the
   * preference vector. Enriched with article info.
   *
   * Already-evaluated articles (any like/dislike feedback) are excluded:
   * training is about teaching the vector on undecided items, so there is
   * no value in re-surfacing something the user has already rated.
   */
  async findBorderline(limit = 30): Promise<QueueListItem[]> {
    const sql = `SELECT ${LIST_SELECT}
       FROM queue_items q JOIN articles a ON a.id = q.article_id
       WHERE q.status = 'unread'
         AND NOT EXISTS(SELECT 1 FROM feedback f WHERE f.article_id = a.id)
       ORDER BY ABS(q.relevance_score - 0.5) ASC, q.added_at DESC
       LIMIT ?`;
    return this.db.prepare<QueueListRow, [number]>(sql).all(limit).map(toListItem);
  }

  /** Single list item (queue + article + feedback) for a given article. */
  async findListItemByArticle(articleId: ArticleId): Promise<QueueListItem | null> {
    const sql = `SELECT ${LIST_SELECT}
       FROM queue_items q JOIN articles a ON a.id = q.article_id
       WHERE a.id = ? LIMIT 1`;
    const row = this.db.query<QueueListRow, [string]>(sql).get(articleId) ?? null;
    return row ? toListItem(row) : null;
  }

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
    if (filter?.favorited !== undefined) {
      conditions.push("favorited = ?");
      params.push(filter.favorited ? 1 : 0);
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
      `INSERT INTO queue_items (id, article_id, status, relevance_score, favorited, added_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status, relevance_score = excluded.relevance_score,
         favorited = excluded.favorited, read_at = excluded.read_at`,
      [
        item.id,
        item.articleId,
        item.status,
        item.relevanceScore.value,
        item.favorited ? 1 : 0,
        item.addedAt.getTime(),
        item.readAt?.getTime() ?? null,
      ],
    );
  }

  async setFavorite(id: QueueItemId, favorited: boolean): Promise<void> {
    this.db.run("UPDATE queue_items SET favorited = ? WHERE id = ?", [favorited ? 1 : 0, id]);
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
