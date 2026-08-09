import { beforeAll, describe, expect, it, mock } from "bun:test";
import { ArticleId, createArticle } from "@feed-reader/domain";
import { Hono } from "hono";
import { createTestRepos } from "../helpers/testDb.ts";

const repos = createTestRepos();
mock.module("../../src/server/db.ts", () => repos);

const { default: articlesRouter } = await import("../../src/server/routes/articles.ts");
const app = new Hono().route("/articles", articlesRouter);

describe("Articles routes", () => {
  beforeAll(async () => {
    const article = createArticle({
      id: ArticleId("test-article-1"),
      url: "https://example.com/article-1",
      title: "Test Article 1",
      sourceType: "rss",
    });
    await repos.articleRepo.save(article);
  });

  it("GET /articles → 200 empty-ish list", async () => {
    const res = await app.request("/articles");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
  });

  it("POST /articles/ingest/url missing url → 400", async () => {
    const res = await app.request("/articles/ingest/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST /articles/ingest/url → 202 returns jobId", async () => {
    const res = await app.request("/articles/ingest/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com" }),
    });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body).toHaveProperty("jobId");
    expect(typeof body.jobId).toBe("string");
  });

  it("GET /articles/:id → 200 for existing article", async () => {
    const res = await app.request("/articles/test-article-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("test-article-1");
    expect(body.title).toBe("Test Article 1");
  });

  it("GET /articles/:id → 404 for nonexistent id", async () => {
    const res = await app.request("/articles/does-not-exist");
    expect(res.status).toBe(404);
  });
});
