import { describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { createTestRepos } from "../helpers/testDb.ts";

const repos = createTestRepos();
mock.module("../../src/server/db.ts", () => repos);

const { default: feedsRouter } = await import("../../src/server/routes/feeds.ts");
const app = new Hono().route("/feeds", feedsRouter);

describe("Feeds routes", () => {
  let feedId: string;

  it("GET /feeds → 200 empty list", async () => {
    const res = await app.request("/feeds");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [], total: 0 });
  });

  it("POST /feeds missing title → 400", async () => {
    const res = await app.request("/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/feed" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /feeds → 201 returns feed", async () => {
    const res = await app.request("/feeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/feed", title: "My Feed" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toBe("https://example.com/feed");
    expect(body.title).toBe("My Feed");
    feedId = body.id;
  });

  it("GET /feeds after POST → 1 item", async () => {
    const res = await app.request("/feeds");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
  });

  it("PATCH /feeds/:id → 200 updated title", async () => {
    const res = await app.request(`/feeds/${feedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Updated");
  });

  it("DELETE /feeds/:id → 204", async () => {
    const res = await app.request(`/feeds/${feedId}`, { method: "DELETE" });
    expect(res.status).toBe(204);
  });
});
