import { ArticleId } from "@feed-reader/domain";
import type { ListResponse, SimilarArticleResponse } from "@feed-reader/types";
import { Hono } from "hono";
import { articleRepo, embeddingRepo } from "../db.ts";

const router = new Hono();

router.get("/:id/similar", async (c) => {
  const articleId = ArticleId(c.req.param("id"));
  const limit = Number(c.req.query("limit") ?? 10);

  const embedding = await embeddingRepo.findByArticleId(articleId);
  if (!embedding) return c.json({ error: "no embedding for article" }, 404);

  const similar = await embeddingRepo.findSimilar(embedding, limit + 1);
  // Exclude self from results
  const results = similar.filter((s) => s.articleId !== articleId).slice(0, limit);

  const body: ListResponse<SimilarArticleResponse> = {
    items: results.map((s) => ({ articleId: s.articleId, similarity: s.similarity })),
    total: results.length,
  };
  return c.json(body);
});

router.get("/:id/related", async (c) => {
  // Kuzu graph traversal (not yet implemented — returns empty)
  const body: ListResponse<SimilarArticleResponse> = { items: [], total: 0 };
  return c.json(body);
});

export const searchRouter = new Hono();

searchRouter.get("/", async (c) => {
  const q = c.req.query("q") ?? "";
  if (!q) return c.json({ error: "q required" }, 400);
  // Full-text search via LIKE — vector hybrid search added once we have embeddings
  const articles = await articleRepo.findMany({ limit: 20 });
  const matched = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q.toLowerCase()) ||
      (a.fullText?.toLowerCase().includes(q.toLowerCase()) ?? false),
  );
  return c.json({
    items: matched.map((a) => ({ id: a.id, title: a.title, url: a.url })),
    total: matched.length,
  });
});

export default router;
