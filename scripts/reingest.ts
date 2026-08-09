#!/usr/bin/env bun
/**
 * Re-ingest maintenance script.
 *
 * Enqueues every article whose ingest_version is below a target version into
 * pending_jobs as `reingest` jobs. The running ingester then re-fetches them
 * in the background (batched, so token/rate limits still apply), refreshing
 * HTML + eyecatch image and re-embedding, keeping each article's id/queue item.
 *
 * Usage:
 *   bun run reingest                 # re-ingest everything below CURRENT_INGEST_VERSION
 *   bun run reingest --before 3      # re-ingest everything below version 3
 *   bun run reingest --dry-run       # just report how many would be queued
 *
 * DB location: $DB_PATH, else apps/app/feed-reader.db (matches `bun run dev`).
 */
import { resolve } from "node:path";
import { createDatabase } from "../packages/db/src/sqlite/index.ts";
import { CURRENT_INGEST_VERSION } from "../packages/domain/src/index.ts";

const args = process.argv.slice(2);
const beforeArg = args.indexOf("--before");
const before = beforeArg >= 0 ? Number(args[beforeArg + 1]) : CURRENT_INGEST_VERSION;
const dryRun = args.includes("--dry-run");

const DB_PATH = process.env.DB_PATH ?? resolve(import.meta.dir, "../apps/app/feed-reader.db");
const db = createDatabase(DB_PATH);

const stale = db
  .query<{ id: string; url: string }, [number]>(
    "SELECT id, url FROM articles WHERE ingest_version < ? ORDER BY created_at DESC",
  )
  .all(before);

console.log(`[reingest] DB: ${DB_PATH}`);
console.log(`[reingest] ${stale.length} article(s) below ingest_version ${before}`);

if (stale.length === 0 || dryRun) {
  if (dryRun) console.log("[reingest] dry run — nothing enqueued");
  process.exit(0);
}

// Clear any previously-queued (not yet processed) reingest jobs to avoid dupes.
db.run(
  "DELETE FROM pending_jobs WHERE job_type = 'reingest' AND status IN ('pending','processing')",
);

const now = Date.now();
const insert = db.prepare(
  "INSERT INTO pending_jobs (id, job_type, payload, status, created_at, updated_at) VALUES (?, 'reingest', ?, 'pending', ?, ?)",
);
const enqueue = db.transaction((rows: typeof stale) => {
  for (const row of rows) {
    insert.run(crypto.randomUUID(), JSON.stringify({ articleId: row.id }), now, now);
  }
});
enqueue(stale);

console.log(`[reingest] enqueued ${stale.length} reingest job(s). The ingester will process them.`);
process.exit(0);
