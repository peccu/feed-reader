import { ArticleId } from "@feed-reader/domain";
import type { ListResponse, SimilarArticleResponse } from "@feed-reader/types";
import { Hono } from "hono";
import { articleRepo, embeddingRepo } from "../db.ts";
import { embedQuery } from "../embed.ts";

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
  const limit = Number(c.req.query("limit") ?? 20);

  // Try vector search first
  const embedding = await embedQuery(q);
  if (embedding) {
    const similar = await embeddingRepo.findSimilar(embedding, limit);
    if (similar.length > 0) {
      const items = await Promise.all(
        similar.map(async (s) => {
          const article = await articleRepo.findById(s.articleId);
          if (!article) return null;
          return { id: article.id, title: article.title, url: article.url, score: s.similarity };
        }),
      );
      const results = items.filter((x): x is NonNullable<typeof x> => x !== null);
      return c.json({ items: results, total: results.length, mode: "vector" });
    }
  }

  // Fallback: title/text LIKE search
  const articles = await articleRepo.findMany({ limit: 200 });
  const ql = q.toLowerCase();
  const matched = articles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(ql) || (a.fullText?.toLowerCase().includes(ql) ?? false),
    )
    .slice(0, limit);
  return c.json({
    items: matched.map((a) => ({ id: a.id, title: a.title, url: a.url, score: null })),
    total: matched.length,
    mode: "text",
  });
});

export default router;
