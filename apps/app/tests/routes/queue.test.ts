import { beforeAll, describe, expect, it, mock } from "bun:test";
import {
  ArticleId,
  QueueItemId,
  createArticle,
  createQueueItem,
  createRelevanceScore,
} from "@feed-reader/domain";
import { Hono } from "hono";
import { createTestRepos } from "../helpers/testDb.ts";

const repos = createTestRepos();
mock.module("../../src/server/db.ts", () => repos);

const { default: queueRouter } = await import("../../src/server/routes/queue.ts");
const app = new Hono().route("/queue", queueRouter);

describe("Queue routes", () => {
  beforeAll(async () => {
    const article = createArticle({
      id: ArticleId("queue-article-1"),
      url: "https://example.com/queue-article-1",
      title: "Queue Test Article",
      sourceType: "rss",
    });
    await repos.articleRepo.save(article);

    const queueItem = createQueueItem({
      id: QueueItemId("queue-item-1"),
      articleId: ArticleId("queue-article-1"),
      relevanceScore: createRelevanceScore(0.8),
    });
    await repos.queueRepo.save(queueItem);
  });

  it("GET /queue → 200 with items", async () => {
    const res = await app.request("/queue");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
    expect(body.total).toBe(1);
  });

  it("GET /queue/stats → 200 with counts", async () => {
    const res = await app.request("/queue/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ unread: 1, reading: 0, read: 0, skipped: 0, archived: 0 });
  });

  it("GET /queue?status=unread → filtered list", async () => {
    const res = await app.request("/queue?status=unread");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].status).toBe("unread");
  });

  it("GET /queue?status=read → empty filtered list", async () => {
    const res = await app.request("/queue?status=read");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(0);
  });

  it("PATCH /queue/:id/status → 200 transitions to reading", async () => {
    const res = await app.request("/queue/queue-item-1/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reading" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("reading");
  });

  it("PATCH /queue/:nonexistent/status → 404", async () => {
    const res = await app.request("/queue/does-not-exist/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "reading" }),
    });
    expect(res.status).toBe(404);
  });
});
