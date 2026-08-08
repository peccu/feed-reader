import type { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import { ArticleId, createArticle, createEmbedding, normalize } from "@feed-reader/domain";
import { ArticleRepo, EmbeddingRepo, createDatabase, initVec } from "../../src/sqlite/index.ts";

let db: Database;
let repo: EmbeddingRepo;
let articleRepo: ArticleRepo;

beforeEach(() => {
  db = createDatabase();
  const ok = initVec(db);
  if (!ok) return; // sqlite-vec not available in this environment
  articleRepo = new ArticleRepo(db);
  repo = new EmbeddingRepo(db);
});

async function seedArticle(id: string) {
  await articleRepo.save(
    createArticle({ id: ArticleId(id), url: `https://a.com/${id}`, title: id, sourceType: "rss" }),
  );
}

function randomVec(dim = 1024): Float32Array {
  const v = new Float32Array(dim);
  for (let i = 0; i < dim; i++) v[i] = Math.random() - 0.5;
  return normalize(v);
}

describe("EmbeddingRepo", () => {
  test("findByArticleId returns null when not found", async () => {
    if (!repo) return;
    expect(await repo.findByArticleId(ArticleId("a1"))).toBeNull();
  });

  test("save and findByArticleId round-trips embedding", async () => {
    if (!repo) return;
    await seedArticle("a1");
    const vec = randomVec();
    const emb = createEmbedding(vec, "jina-embeddings-v3");
    await repo.save(ArticleId("a1"), emb);

    const found = await repo.findByArticleId(ArticleId("a1"));
    expect(found).not.toBeNull();
    expect(found?.model).toBe("jina-embeddings-v3");
    expect(found?.vector.length).toBe(1024);
    // Values should be approximately equal (float32 precision)
    for (let i = 0; i < 1024; i++) {
      expect(Math.abs((found?.vector[i] ?? 0) - (vec[i] ?? 0))).toBeLessThan(1e-6);
    }
  });

  test("save is idempotent (upsert replaces)", async () => {
    if (!repo) return;
    await seedArticle("a1");
    const vec1 = randomVec();
    const vec2 = randomVec();
    await repo.save(ArticleId("a1"), createEmbedding(vec1, "jina-embeddings-v3"));
    await repo.save(ArticleId("a1"), createEmbedding(vec2, "jina-embeddings-v3"));

    const found = await repo.findByArticleId(ArticleId("a1"));
    // Should have the second vector
    for (let i = 0; i < 1024; i++) {
      expect(Math.abs((found?.vector[i] ?? 0) - (vec2[i] ?? 0))).toBeLessThan(1e-6);
    }
  });

  test("findSimilar returns articles ordered by similarity", async () => {
    if (!repo) return;
    await seedArticle("a1");
    await seedArticle("a2");
    await seedArticle("a3");

    const query = randomVec();

    // a1: identical to query (similarity ≈ 1)
    await repo.save(
      ArticleId("a1"),
      createEmbedding(new Float32Array(query), "jina-embeddings-v3"),
    );

    // a2: random
    await repo.save(ArticleId("a2"), createEmbedding(randomVec(), "jina-embeddings-v3"));

    // a3: random
    await repo.save(ArticleId("a3"), createEmbedding(randomVec(), "jina-embeddings-v3"));

    const results = await repo.findSimilar(
      createEmbedding(new Float32Array(query), "jina-embeddings-v3"),
      3,
    );

    expect(results.length).toBe(3);
    // a1 (identical) should be first
    expect(results[0]?.articleId).toBe("a1");
    // similarity of identical vectors should be ≈ 1
    expect(results[0]?.similarity).toBeGreaterThan(0.99);
    // Results should be ordered descending by similarity
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.similarity).toBeGreaterThanOrEqual(results[i]?.similarity);
    }
  });

  test("findSimilar respects limit", async () => {
    if (!repo) return;
    for (let i = 1; i <= 5; i++) {
      await seedArticle(`a${i}`);
      await repo.save(ArticleId(`a${i}`), createEmbedding(randomVec(), "jina-embeddings-v3"));
    }
    const results = await repo.findSimilar(createEmbedding(randomVec(), "jina-embeddings-v3"), 3);
    expect(results.length).toBe(3);
  });
});
