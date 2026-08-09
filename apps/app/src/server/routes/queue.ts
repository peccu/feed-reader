import { QueueItemId, transitionStatus } from "@feed-reader/domain";
import type {
  ListResponse,
  QueueItemResponse,
  QueueStatsResponse,
  UpdateQueueStatusRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { queueRepo } from "../db.ts";

function toResponse(item: {
  id: string;
  articleId: string;
  status: string;
  relevanceScore: { value: number };
  addedAt: Date;
  readAt: Date | null;
}): QueueItemResponse {
  return {
    id: item.id,
    articleId: item.articleId,
    status: item.status,
    relevanceScore: item.relevanceScore.value,
    addedAt: item.addedAt.toISOString(),
    readAt: item.readAt?.toISOString() ?? null,
  };
}

const router = new Hono();

router.get("/", async (c) => {
  const rawStatus = c.req.query("status") as import("@feed-reader/domain").QueueStatus | undefined;
  const limit = Number(c.req.query("limit") ?? 50);
  const rawSort = c.req.query("sort") as "relevance" | "addedAt" | undefined;
  const items = await queueRepo.findMany({
    limit,
    ...(rawStatus ? { status: rawStatus } : {}),
    ...(rawSort ? { sortBy: rawSort } : {}),
  });
  const body: ListResponse<QueueItemResponse> = {
    items: items.map(toResponse),
    total: items.length,
  };
  return c.json(body);
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

export default router;
