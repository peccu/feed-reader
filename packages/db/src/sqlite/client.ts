import { Database } from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  polling_interval_seconds INTEGER NOT NULL DEFAULT 3600,
  last_polled_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  feed_id TEXT REFERENCES feeds(id),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  full_text TEXT,
  html TEXT,
  lead_image_url TEXT,
  summary TEXT,
  published_at INTEGER,
  scraped_at INTEGER,
  source_type TEXT NOT NULL CHECK(source_type IN ('rss','url','html_post','bookmark')),
  word_count INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending','processing','done','failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id),
  status TEXT NOT NULL DEFAULT 'unread'
    CHECK(status IN ('unread','reading','read','skipped','archived')),
  relevance_score REAL NOT NULL DEFAULT 0.0,
  added_at INTEGER NOT NULL,
  read_at INTEGER
);

CREATE TABLE IF NOT EXISTS preference_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  learning_rate REAL NOT NULL DEFAULT 0.05,
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS preference_vectors (
  profile_id TEXT NOT NULL REFERENCES preference_profiles(id),
  target TEXT NOT NULL CHECK(target IN ('preference','shareable','knowledge')),
  vector BLOB NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (profile_id, target)
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id),
  feedback_type TEXT NOT NULL CHECK(feedback_type IN ('like','dislike')),
  vector_target TEXT NOT NULL CHECK(vector_target IN ('preference','shareable','knowledge')),
  applied INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_auto_cluster INTEGER NOT NULL DEFAULT 0,
  centroid_vector BLOB,
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS article_categories (
  article_id TEXT NOT NULL REFERENCES articles(id),
  category_id TEXT NOT NULL REFERENCES categories(id),
  assigned_by TEXT NOT NULL CHECK(assigned_by IN ('manual','auto')),
  assigned_at INTEGER NOT NULL,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id),
  content TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK(note_type IN ('manual','claude_conversation','quote')),
  claude_session_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id),
  action_type TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_articles_source_type ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_queue_items_status ON queue_items(status);
CREATE INDEX IF NOT EXISTS idx_queue_items_relevance ON queue_items(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_applied ON feedback(applied, vector_target);
CREATE INDEX IF NOT EXISTS idx_notes_article_id ON notes(article_id);
CREATE INDEX IF NOT EXISTS idx_pending_jobs_status ON pending_jobs(status);
`;

const VEC_SCHEMA = `
CREATE TABLE IF NOT EXISTS article_embedding_meta (
  id      INTEGER PRIMARY KEY,
  article_id TEXT NOT NULL UNIQUE REFERENCES articles(id),
  model   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS article_embeddings USING vec0(
  embedding FLOAT[1024]
);
`;

export function createDatabase(path = ":memory:"): Database {
  const db = new Database(path, { create: true });
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Idempotent column additions for DBs created before a column existed. */
function migrate(db: Database): void {
  const cols = db
    .query<{ name: string }, []>("PRAGMA table_info(articles)")
    .all()
    .map((r) => r.name);
  if (!cols.includes("html")) db.run("ALTER TABLE articles ADD COLUMN html TEXT");
  if (!cols.includes("lead_image_url")) {
    db.run("ALTER TABLE articles ADD COLUMN lead_image_url TEXT");
  }
}

/**
 * Load sqlite-vec and create vec0 virtual tables.
 * Must be called after createDatabase() when vector search is needed.
 * Returns true if vec support is available.
 */
export function initVec(db: Database): boolean {
  try {
    (sqliteVec as { load: (db: Database) => void }).load(db);
    db.exec(VEC_SCHEMA);
    return true;
  } catch (e) {
    console.warn("[db] sqlite-vec not available:", e);
    return false;
  }
}

/** Dynamic UPDATE helper for partial patch methods */
export function patchRow(
  db: Database,
  table: string,
  id: string,
  cols: Record<string, string | number | boolean | null | Uint8Array | undefined>,
): void {
  const entries = Object.entries(cols).filter(([, v]) => v !== undefined) as [
    string,
    string | number | boolean | null | Uint8Array,
  ][];
  if (entries.length === 0) return;
  const set = entries.map(([k]) => `${k} = ?`).join(", ");
  db.run(`UPDATE ${table} SET ${set}, updated_at = ? WHERE id = ?`, [
    ...entries.map(([, v]) => v),
    Date.now(),
    id,
  ]);
}
