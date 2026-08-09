#!/usr/bin/env bun
/**
 * Seed the local development database with realistic test data.
 * Usage: bun run scripts/seed.ts [--db <path>] [--reset]
 *
 * Options:
 *   --db <path>   Database file path (default: feed-reader.db)
 *   --reset       Delete and recreate the database before seeding
 */
import { unlinkSync } from "node:fs";
import {
  ArticleRepo,
  FeedRepo,
  NoteRepo,
  QueueRepo,
  createDatabase,
  initVec,
} from "../packages/db/src/sqlite/index.ts";
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
} from "../packages/domain/src/index.ts";

const args = process.argv.slice(2);
const dbIndex = args.indexOf("--db");
const DB_PATH = dbIndex >= 0 ? (args[dbIndex + 1] ?? "feed-reader.db") : "feed-reader.db";
const shouldReset = args.includes("--reset");

if (shouldReset) {
  try {
    unlinkSync(DB_PATH);
    console.log(`Deleted ${DB_PATH}`);
  } catch {
    // file didn't exist
  }
}

console.log(`Seeding database: ${DB_PATH}`);

const db = createDatabase(DB_PATH);
initVec(db);

const feedRepo = new FeedRepo(db);
const articleRepo = new ArticleRepo(db);
const queueRepo = new QueueRepo(db);
const noteRepo = new NoteRepo(db);

// --- Feeds ---
const feeds = [
  {
    id: FeedId("feed-tech"),
    url: "https://example.com/tech.xml",
    title: "Tech News",
    description: "Latest technology news",
    pollingIntervalSeconds: 3600,
  },
  {
    id: FeedId("feed-ai"),
    url: "https://example.com/ai.xml",
    title: "AI & ML Weekly",
    description: "Artificial intelligence and machine learning",
  },
  {
    id: FeedId("feed-dev"),
    url: "https://example.com/dev.xml",
    title: "Developer Digest",
    description: "Software development tips and tools",
  },
];

for (const f of feeds) {
  const existing = await feedRepo.findById(f.id);
  if (!existing) {
    const feed = createFeed(f);
    await feedRepo.save(feed);
    console.log(`  Feed: ${feed.title}`);
  }
}

// --- Articles with realistic content ---
const articleData = [
  {
    id: ArticleId("art-001"),
    feedId: FeedId("feed-tech"),
    url: "https://example.com/article/typescript-5-features",
    title: "TypeScript 5.0: What's New and Why It Matters",
    author: "Jane Smith",
    fullText: `TypeScript 5.0 brings significant improvements to the developer experience.
The release includes decorators support, const type parameters, and faster builds.

## Decorators

After years of being experimental, decorators are now stable in TypeScript 5.0.
This enables cleaner class-based patterns for frameworks like Angular and NestJS.

\`\`\`typescript
@Injectable()
class UserService {
  constructor(private readonly db: Database) {}
}
\`\`\`

## Const Type Parameters

A new \`const\` modifier for type parameters allows inferring literal types:

\`\`\`typescript
function identity<const T>(value: T): T {
  return value;
}
const x = identity(["hello", "world"]); // type: readonly ["hello", "world"]
\`\`\`

## Performance Improvements

Build times are 10-15% faster in most projects due to internal refactoring.
The TypeScript team continues to push the compiler performance envelope.`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: ArticleId("art-002"),
    feedId: FeedId("feed-ai"),
    url: "https://example.com/article/llm-context-window",
    title: "Understanding Context Windows in Large Language Models",
    author: "Alex Chen",
    fullText: `Context windows define how much text a language model can process at once.
Modern LLMs have expanded from 4K to 128K+ tokens.

## Why Context Windows Matter

Larger context windows allow models to:
- Process entire codebases
- Maintain longer conversations
- Analyze full documents without chunking

## Technical Challenges

Extending context windows requires solving the quadratic attention complexity problem.
Techniques like sparse attention and sliding windows help manage memory usage.

## Practical Implications

For developers, larger context windows mean fewer workarounds for long documents.
RAG (Retrieval Augmented Generation) systems still have value for dynamic, updatable knowledge.`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: ArticleId("art-003"),
    feedId: FeedId("feed-dev"),
    url: "https://example.com/article/bun-vs-node",
    title: "Bun 1.0 in Production: Six Months Later",
    author: "Sam Wilson",
    fullText: `We migrated our entire backend to Bun six months ago. Here's what we learned.

## Performance Wins

Our API response times improved by 30% on average. The built-in SQLite support
eliminated the need for connection pooling middleware.

## Compatibility Challenges

Most npm packages work seamlessly, but a few edge cases required patches:
- Some native addons need recompilation
- Certain Jest matchers behave slightly differently

## Developer Experience

The integrated test runner (bun:test) is a joy to use. TypeScript just works
without configuration. Hot reload is noticeably faster than tsx or ts-node.

## Recommendation

Bun is production-ready for most use cases. We'll never go back to Node.`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: ArticleId("art-004"),
    feedId: FeedId("feed-tech"),
    url: "https://example.com/article/sqlite-vec",
    title: "Vector Search with SQLite: sqlite-vec Deep Dive",
    author: "Pat Johnson",
    fullText: `sqlite-vec brings vector similarity search directly into SQLite.
No separate vector database required.

## Getting Started

\`\`\`sql
-- Load extension
SELECT load_extension('sqlite-vec');

-- Create vector table
CREATE VIRTUAL TABLE embeddings USING vec0(
  embedding FLOAT[1024]
);

-- Insert vectors
INSERT INTO embeddings(rowid, embedding) VALUES (1, '[0.1, 0.2, ...]');

-- KNN search
SELECT rowid, distance
FROM embeddings
WHERE embedding MATCH '[0.3, 0.4, ...]'
AND k = 10;
\`\`\`

## Rowid Limitation

sqlite-vec vec0 tables only support INTEGER rowid, not TEXT primary keys.
Work around this with a separate metadata table mapping TEXT IDs to integer rowids.

## Performance

For datasets under 1M vectors, sqlite-vec performs comparably to dedicated
vector databases like Qdrant or Weaviate.`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: ArticleId("art-005"),
    feedId: FeedId("feed-ai"),
    url: "https://example.com/article/rag-patterns",
    title: "RAG Patterns: Beyond Naive Retrieval",
    author: "Riley Moore",
    fullText: `Naive RAG (retrieve top-k chunks, append to prompt) works for demos
but breaks down in production. Here are better patterns.

## Hybrid Search

Combine vector similarity with BM25 keyword search for better recall.
Pure semantic search misses exact matches; pure keyword search misses synonyms.

## Re-ranking

Add a cross-encoder re-ranker after initial retrieval to improve precision.
This adds latency but dramatically improves answer quality.

## Contextual Chunks

Instead of fixed-size chunks, extract semantically coherent passages.
Header-aware chunking preserves document structure.

## Query Expansion

Generate multiple query variations before retrieval.
Different phrasings capture different relevant documents.

## Evaluation

Use RAGAS or TruLens to measure faithfulness, answer relevance, and context recall.
Don't optimize what you don't measure.`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: ArticleId("art-006"),
    feedId: FeedId("feed-dev"),
    url: "https://example.com/article/vue3-composables",
    title: "Vue 3 Composables: Patterns and Pitfalls",
    author: "Casey Lee",
    fullText: `Vue 3 composables are the successor to Vue 2 mixins. They're more
flexible but come with their own traps.

## The Good

Composables enable clean separation of reactive logic:

\`\`\`typescript
function useCounter(initial = 0) {
  const count = ref(initial);
  const increment = () => count.value++;
  const reset = () => { count.value = initial; };
  return { count, increment, reset };
}
\`\`\`

## Common Pitfalls

1. **Reactive loss**: Destructuring reactive objects loses reactivity
2. **SSR issues**: Server-side refs must be created inside setup()
3. **Memory leaks**: Always call onUnmounted() to clean up subscriptions

## Best Practices

- Keep composables focused on a single concern
- Return readonly refs when mutation should be controlled
- Name with "use" prefix for discoverability`,
    sourceType: "rss" as const,
    publishedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
  },
];

let seededArticles = 0;
let seededQueue = 0;

for (let i = 0; i < articleData.length; i++) {
  const data = articleData[i];
  if (!data) continue;
  const existing = await articleRepo.findById(data.id);
  if (!existing) {
    const article = createArticle(data);
    await articleRepo.save(article);
    seededArticles++;

    // Add first 4 to unread queue
    if (i < 4) {
      const score = createRelevanceScore(Math.max(0.1, 0.95 - i * 0.15));
      const item = createQueueItem({
        id: QueueItemId(`queue-${data.id}`),
        articleId: data.id,
        relevanceScore: score,
      });
      await queueRepo.save(item);
      seededQueue++;
    }
  }
}

// --- Notes ---
const noteData = [
  {
    id: NoteId("note-001"),
    articleId: ArticleId("art-001"),
    content: "TypeScriptのデコレーター、Angular使うなら必須。const型パラメータも便利そう。",
    noteType: "manual" as const,
  },
  {
    id: NoteId("note-002"),
    articleId: ArticleId("art-002"),
    content: "コンテキストウィンドウが広がってもRAGはまだ有用。動的知識の更新が必要なケースで。",
    noteType: "manual" as const,
  },
];

let seededNotes = 0;
for (const n of noteData) {
  try {
    const note = createNote(n);
    await noteRepo.save(note);
    seededNotes++;
  } catch {
    // already exists
  }
}

console.log(`
Seeded:
  Feeds:    ${feeds.length}
  Articles: ${seededArticles} (${articleData.length - seededArticles} skipped — already existed)
  Queue:    ${seededQueue} unread items
  Notes:    ${seededNotes}

Start the dev server:
  cd apps/app && bun run dev:server   # API server (port 3000)
  cd apps/app && bun run dev:client   # Vite dev server (port 5173)

Or run both:
  bun run dev
`);
