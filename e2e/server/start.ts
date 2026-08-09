#!/usr/bin/env bun
/**
 * E2E test server: seeds a fresh DB and starts the Hono server on port 3737.
 * Must be started BEFORE Playwright tests run.
 * playwright.config.ts uses this as webServer.command.
 */
import { unlinkSync } from "node:fs";
import {
  ArticleRepo,
  FeedRepo,
  NoteRepo,
  QueueRepo,
  createDatabase,
  initVec,
} from "../../packages/db/src/sqlite/index.ts";
import {
  ArticleId,
  FeedId,
  NoteId,
  QueueItemId,
  createArticle,
  createFeed,
  createNote,
  createQueueItem,
  createRelevanceScore,
} from "../../packages/domain/src/index.ts";

const DB_PATH = "/tmp/feed-reader-e2e.db";
try {
  unlinkSync(DB_PATH);
} catch {
  // file didn't exist yet
}

process.env.DB_PATH = DB_PATH;
process.env.PORT = "3737";
process.env.DIST_ROOT = "./apps/app/dist/client";
// Disable claude-worker proxy errors in tests
process.env.CLAUDE_WORKER_URL = "http://localhost:9999";

// Seed the database
const db = createDatabase(DB_PATH);
initVec(db);

const feedRepo = new FeedRepo(db);
const articleRepo = new ArticleRepo(db);
const queueRepo = new QueueRepo(db);
const noteRepo = new NoteRepo(db);

const feed = createFeed({
  id: FeedId("e2e-feed-1"),
  url: "https://example.com/feed.xml",
  title: "Tech News",
  description: "Technology news for E2E tests",
  pollingIntervalSeconds: 3600,
});
await feedRepo.save(feed);

const articles = [
  {
    id: ArticleId("e2e-art-0"),
    title: "Test Article 1: TypeScript Advances",
    url: "https://example.com/ts-advances",
    fullText:
      "TypeScript continues to evolve with better type inference and faster compilation. This article explores the latest features in TypeScript 5.0 including decorators, const type parameters, and performance improvements that make large codebases more manageable. The TypeScript team has been hard at work improving both the language semantics and the developer experience.".repeat(
        3,
      ),
    score: 0.95,
  },
  {
    id: ArticleId("e2e-art-1"),
    title: "Test Article 2: Vector Databases Explained",
    url: "https://example.com/vector-db",
    fullText:
      "Vector databases enable semantic search by storing high-dimensional embeddings. Unlike traditional SQL databases, vector databases are optimized for nearest-neighbor queries. This piece covers the basics of how embeddings work, why cosine similarity is used, and when you should reach for a vector database versus simpler alternatives.".repeat(
        3,
      ),
    score: 0.82,
  },
  {
    id: ArticleId("e2e-art-2"),
    title: "Test Article 3: Bun Runtime Performance",
    url: "https://example.com/bun-perf",
    fullText:
      "Bun 1.0 demonstrates exceptional performance in benchmarks compared to Node.js and Deno. The built-in SQLite support, fast module resolution, and optimized JavaScript engine make it an excellent choice for server-side applications. We ran comprehensive benchmarks across HTTP servers, file I/O, and database operations.".repeat(
        3,
      ),
    score: 0.71,
  },
  {
    id: ArticleId("e2e-art-3"),
    title: "Test Article 4: Vue 3 Composition API",
    url: "https://example.com/vue3-composition",
    fullText:
      "The Composition API in Vue 3 provides a more flexible way to organize component logic. Composables replace mixins with better TypeScript support and clearer data flow. This guide covers the transition from Options API to Composition API with practical examples and common patterns for state management, side effects, and reusable logic.".repeat(
        3,
      ),
    score: 0.58,
  },
  {
    id: ArticleId("e2e-art-4"),
    title: "Test Article 5: SQLite for Production",
    url: "https://example.com/sqlite-prod",
    fullText:
      "SQLite is often dismissed as a toy database, but it powers millions of production applications. With WAL mode, it handles concurrent reads efficiently. This article examines real-world scenarios where SQLite outperforms PostgreSQL and when you should make the switch to a client-server database.".repeat(
        3,
      ),
    score: 0.44,
  },
];

for (const { id, title, url, fullText, score } of articles) {
  const article = createArticle({
    id,
    feedId: FeedId("e2e-feed-1"),
    url,
    title,
    fullText,
    sourceType: "rss",
    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  });
  await articleRepo.save(article);

  const queueItem = createQueueItem({
    id: QueueItemId(`e2e-queue-${id}`),
    articleId: id,
    relevanceScore: createRelevanceScore(score),
  });
  await queueRepo.save(queueItem);
}

// Add a note for the first article
await noteRepo.save(
  createNote({
    id: NoteId("e2e-note-1"),
    articleId: ArticleId("e2e-art-0"),
    content: "このTypeScriptの記事は後で読み返したい。デコレーターの部分が特に参考になる。",
    noteType: "manual",
  }),
);

console.log("E2E server: seeded 1 feed, 5 articles, 5 queue items, 1 note");

// Start the Hono server (dynamic import so env vars are set first)
const { default: serverConfig } = await import("../../apps/app/src/server/index.ts");
const server = Bun.serve({ port: 3737, fetch: serverConfig.fetch });
console.log(`E2E server listening on http://localhost:${server.port}`);
