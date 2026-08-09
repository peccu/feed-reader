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
import { articleRepo, db } from "../db.ts";

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

function feedTitleFor(feedId: string | null): string | null {
  if (!feedId) return null;
  const row = db
    .query<{ title: string }, [string]>("SELECT title FROM feeds WHERE id = ?")
    .get(feedId);
  return row?.title ?? null;
}

function toDetailResponse(
  a: NonNullable<Awaited<ReturnType<typeof articleRepo.findById>>>,
): ArticleDetailResponse {
  return {
    ...toResponse(a),
    fullText: a.fullText ?? null,
    html: a.html ?? null,
    leadImageUrl: a.leadImageUrl ?? null,
    feedTitle: feedTitleFor(a.feedId),
  };
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

router.get("/ingest/pending", (c) => {
  const row = db
    .query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM pending_jobs WHERE status IN ('pending','processing')",
    )
    .get();
  return c.json({ count: row?.count ?? 0 });
});

router.post("/ingest/url", async (c) => {
  const body = await c.req.json<IngestUrlRequest>();
  if (!body.url) return c.json({ error: "url required" }, 400);
  const jobId = crypto.randomUUID();
  const now = Date.now();
  db.run(
    "INSERT INTO pending_jobs (id, job_type, payload, status, created_at, updated_at) VALUES (?, 'ingest_url', ?, 'pending', ?, ?)",
    [jobId, JSON.stringify({ url: body.url }), now, now],
  );
  const resp: IngestJobResponse = { jobId };
  return c.json(resp, 202);
});

router.post("/ingest/html", async (c) => {
  const body = await c.req.json<IngestHtmlRequest>();
  if (!body.url || !body.html) return c.json({ error: "url and html required" }, 400);
  const articleId = ArticleId(crypto.randomUUID());
  const article = createArticle({
    id: articleId,
    url: body.url,
    title: body.title ?? body.url,
    fullText: body.html,
    html: body.html,
    sourceType: "html_post",
  });
  await articleRepo.save(article);
  const now = Date.now();
  const jobId = crypto.randomUUID();
  db.run(
    "INSERT INTO pending_jobs (id, job_type, payload, status, created_at, updated_at) VALUES (?, 'ingest_html', ?, 'pending', ?, ?)",
    [jobId, JSON.stringify({ url: body.url, articleId }), now, now],
  );
  const resp: IngestJobResponse = { jobId };
  return c.json(resp, 202);
});

export { CLAUDE_WORKER_URL };
export default router;
