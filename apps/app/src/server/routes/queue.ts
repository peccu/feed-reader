import { QueueItemId, type QueueStatus, transitionStatus } from "@feed-reader/domain";
import type {
  ListResponse,
  QueueItemResponse,
  QueueListItemResponse,
  QueueStatsResponse,
  UpdateFavoriteRequest,
  UpdateQueueStatusRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { queueRepo } from "../db.ts";

function toResponse(item: {
  id: string;
  articleId: string;
  status: string;
  relevanceScore: { value: number };
  favorited: boolean;
  addedAt: Date;
  readAt: Date | null;
}): QueueItemResponse {
  return {
    id: item.id,
    articleId: item.articleId,
    status: item.status,
    relevanceScore: item.relevanceScore.value,
    favorited: item.favorited,
    addedAt: item.addedAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  };
}

const router = new Hono();

router.get("/", async (c) => {
  const rawStatus = c.req.query("status") as QueueStatus | undefined;
  const limit = Number(c.req.query("limit") ?? 50);
  const rawSort = c.req.query("sort") as "relevance" | "addedAt" | undefined;
  const favorited = c.req.query("favorited");
  const items = await queueRepo.findMany({
    limit,
    ...(rawStatus ? { status: rawStatus } : {}),
    ...(favorited !== undefined ? { favorited: favorited === "1" || favorited === "true" } : {}),
    ...(rawSort ? { sortBy: rawSort } : {}),
  });
  const body: ListResponse<QueueItemResponse> = {
    items: items.map(toResponse),
    total: items.length,
  };
  return c.json(body);
});

// Enriched list (with article title/image) for the library screen.
router.get("/list", async (c) => {
  const rawStatus = c.req.query("status") as QueueStatus | undefined;
  const limit = Number(c.req.query("limit") ?? 100);
  const favorited = c.req.query("favorited");
  const rawSort = c.req.query("sort") as "relevance" | "addedAt" | undefined;
  const rows = await queueRepo.findListView({
    limit,
    ...(rawStatus ? { status: rawStatus } : {}),
    ...(favorited !== undefined ? { favorited: favorited === "1" || favorited === "true" } : {}),
    ...(rawSort ? { sortBy: rawSort } : {}),
  });
  const items: QueueListItemResponse[] = rows.map((r) => ({
    ...toResponse(r.item),
    title: r.title,
    url: r.url,
    leadImageUrl: r.leadImageUrl,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    feedback: r.feedback,
  }));
  return c.json({ items, total: items.length });
});

// Borderline-score unread items for the training screen.
router.get("/training", async (c) => {
  const limit = Number(c.req.query("limit") ?? 30);
  const rows = await queueRepo.findBorderline(limit);
  const items: QueueListItemResponse[] = rows.map((r) => ({
    ...toResponse(r.item),
    title: r.title,
    url: r.url,
    leadImageUrl: r.leadImageUrl,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    feedback: r.feedback,
  }));
  return c.json({ items, total: items.length });
});

router.get("/stats", async (c) => {
  const [unread, reading, read, skipped, archived] = await Promise.all([
    queueRepo.countByStatus("unread"),
    queueRepo.countByStatus("reading"),
    queueRepo.countByStatus("read"),
    queueRepo.countByStatus("skipped"),
    queueRepo.countByStatus("archived"),
  ]);
  const body: QueueStatsResponse = { unread, reading, read, skipped, archived };
  return c.json(body);
});

router.patch("/:id/status", async (c) => {
  const id = QueueItemId(c.req.param("id"));
  const body = await c.req.json<UpdateQueueStatusRequest>();
  const item = await queueRepo.findById(id);
  if (!item) return c.json({ error: "not found" }, 404);
  const next = transitionStatus(item, body.status);
  await queueRepo.updateStatus(id, next.status, next.readAt ?? undefined);
  return c.json(toResponse(next));
});

router.patch("/:id/favorite", async (c) => {
  const id = QueueItemId(c.req.param("id"));
  const body = await c.req.json<UpdateFavoriteRequest>();
  const item = await queueRepo.findById(id);
  if (!item) return c.json({ error: "not found" }, 404);
  await queueRepo.setFavorite(id, body.favorited);
  return c.json(toResponse({ ...item, favorited: body.favorited }));
});

export default router;
