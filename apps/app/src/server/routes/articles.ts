import { ArticleId, createArticle } from "@feed-reader/domain";
import type {
  ArticleDetailResponse,
  ArticleResponse,
  IngestHtmlRequest,
  IngestJobResponse,
  IngestUrlRequest,
  ListResponse,
} from "@feed-reader/types";
import { Hono } from "hono";
import { articleRepo } from "../db.ts";

const CLAUDE_WORKER_URL = process.env.CLAUDE_WORKER_URL ?? "http://claude-worker:3001";

function toResponse(a: Awaited<ReturnType<typeof articleRepo.findById>>): ArticleResponse {
  if (!a) throw new Error("article is null");
  return {
    id: a.id,
    feedId: a.feedId,
    url: a.url,
    title: a.title,
    author: a.author,
    summary: a.summary,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    sourceType: a.sourceType,
    wordCount: a.wordCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function toDetailResponse(
  a: Awaited<ReturnType<typeof articleRepo.findById>>,
): ArticleDetailResponse {
  return { ...toResponse(a), fullText: (a as { fullText: string | null }).fullText ?? null };
}

const router = new Hono();

router.get("/", async (c) => {
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const articles = await articleRepo.findMany({ limit, offset });
  const body: ListResponse<ArticleResponse> = {
    items: articles.map(toResponse),
    total: articles.length,
  };
  return c.json(body);
});

router.get("/:id", async (c) => {
  const article = await articleRepo.findById(ArticleId(c.req.param("id")));
  if (!article) return c.json({ error: "not found" }, 404);
  return c.json(toDetailResponse(article));
});

router.post("/ingest/url", async (c) => {
  const body = await c.req.json<IngestUrlRequest>();
  if (!body.url) return c.json({ error: "url required" }, 400);
  const jobId = crypto.randomUUID();
  // Insert into pending_jobs — ingester will pick it up
  const article = createArticle({
    id: ArticleId(jobId),
    url: body.url,
    title: body.url,
    sourceType: "url",
  });
  // We insert an article stub immediately; ingester enriches it
  await articleRepo.save(article);
  // Optionally notify ingester via claude-worker
  fetch(`${CLAUDE_WORKER_URL}/health`).catch(() => {});
  const resp: IngestJobResponse = { jobId };
  return c.json(resp, 202);
});

router.post("/ingest/html", async (c) => {
  const body = await c.req.json<IngestHtmlRequest>();
  if (!body.url || !body.html) return c.json({ error: "url and html required" }, 400);
  const jobId = crypto.randomUUID();
  const article = createArticle({
    id: ArticleId(jobId),
    url: body.url,
    title: body.title ?? body.url,
    fullText: body.html,
    sourceType: "html_post",
  });
  await articleRepo.save(article);
  const resp: IngestJobResponse = { jobId };
  return c.json(resp, 202);
});

export { CLAUDE_WORKER_URL };
export default router;
