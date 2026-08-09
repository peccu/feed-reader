import type {
  AdminStatsResponse,
  DebugQueryRequest,
  DebugQueryResponse,
  FeedbackByDomainItem,
  FeedbackByDomainResponse,
  PendingJobResponse,
  ServiceHealthResponse,
} from "@feed-reader/types";
import { Hono } from "hono";
import { db } from "../db.ts";

/** Extract a bare host (no leading www.) from a URL, or "(unknown)". */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "(unknown)";
  }
}

const CLAUDE_WORKER_URL = process.env.CLAUDE_WORKER_URL ?? "http://localhost:3001";

const router = new Hono();

function count(sql: string): number {
  const row = db.query<{ c: number }, []>(sql).get();
  return row?.c ?? 0;
}

function countBy(table: string, column: string, value: string): number {
  const row = db
    .query<{ c: number }, [string]>(`SELECT COUNT(*) AS c FROM ${table} WHERE ${column} = ?`)
    .get(value);
  return row?.c ?? 0;
}

router.get("/stats", (c) => {
  const body: AdminStatsResponse = {
    articles: count("SELECT COUNT(*) AS c FROM articles"),
    feeds: count("SELECT COUNT(*) AS c FROM feeds"),
    notes: count("SELECT COUNT(*) AS c FROM notes"),
    categories: count("SELECT COUNT(*) AS c FROM categories"),
    queue: {
      unread: countBy("queue_items", "status", "unread"),
      reading: countBy("queue_items", "status", "reading"),
      read: countBy("queue_items", "status", "read"),
      skipped: countBy("queue_items", "status", "skipped"),
      archived: countBy("queue_items", "status", "archived"),
    },
    pendingJobs: {
      pending: countBy("pending_jobs", "status", "pending"),
      processing: countBy("pending_jobs", "status", "processing"),
      done: countBy("pending_jobs", "status", "done"),
      failed: countBy("pending_jobs", "status", "failed"),
    },
    feedback: {
      like: countBy("feedback", "feedback_type", "like"),
      dislike: countBy("feedback", "feedback_type", "dislike"),
    },
  };
  return c.json(body);
});

// Like/dislike aggregated by source domain. Hostnames are derived in JS since
// SQLite has no URL parser.
router.get("/feedback-by-domain", (c) => {
  const rows = db
    .query<{ url: string; feedback_type: string }, []>(
      `SELECT a.url AS url, f.feedback_type AS feedback_type
         FROM feedback f JOIN articles a ON a.id = f.article_id`,
    )
    .all();
  const byHost = new Map<string, FeedbackByDomainItem>();
  for (const r of rows) {
    const host = hostOf(r.url);
    const item = byHost.get(host) ?? { host, like: 0, dislike: 0, total: 0 };
    if (r.feedback_type === "like") item.like += 1;
    else if (r.feedback_type === "dislike") item.dislike += 1;
    item.total += 1;
    byHost.set(host, item);
  }
  const items = [...byHost.values()].sort((a, b) => b.total - a.total);
  const body: FeedbackByDomainResponse = { items };
  return c.json(body);
});

router.get("/jobs", (c) => {
  const limit = Number(c.req.query("limit") ?? 30);
  const type = c.req.query("type");
  type Row = {
    id: string;
    job_type: string;
    status: string;
    payload: string;
    error: string | null;
    created_at: number;
    updated_at: number;
  };
  const base =
    "SELECT id, job_type, status, payload, error, created_at, updated_at FROM pending_jobs";
  const rows = type
    ? db
        .query<Row, [string, number]>(`${base} WHERE job_type = ? ORDER BY created_at DESC LIMIT ?`)
        .all(type, limit)
    : db.query<Row, [number]>(`${base} ORDER BY created_at DESC LIMIT ?`).all(limit);
  const items: PendingJobResponse[] = rows.map((r) => ({
    id: r.id,
    jobType: r.job_type,
    status: r.status,
    payload: r.payload,
    error: r.error,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
  return c.json({ items, total: items.length });
});

router.get("/health", async (c) => {
  const services: ServiceHealthResponse[] = [];

  // app: this process is serving the request.
  services.push({ name: "app", status: "up", detail: null });

  // ingester: alive if it wrote a heartbeat recently.
  const hb = db
    .query<{ beat_at: number }, []>("SELECT beat_at FROM heartbeats WHERE name = 'ingester'")
    .get();
  if (!hb) {
    services.push({ name: "ingester", status: "unknown", detail: "no heartbeat yet" });
  } else {
    const ageMs = Date.now() - hb.beat_at;
    services.push({
      name: "ingester",
      status: ageMs < 30_000 ? "up" : "down",
      detail: `last beat ${Math.round(ageMs / 1000)}s ago`,
    });
  }

  // claude-worker: probe its /health endpoint.
  try {
    const res = await fetch(`${CLAUDE_WORKER_URL}/health`, { signal: AbortSignal.timeout(2000) });
    services.push({
      name: "claude-worker",
      status: res.ok ? "up" : "down",
      detail: `HTTP ${res.status}`,
    });
  } catch {
    services.push({ name: "claude-worker", status: "down", detail: "unreachable" });
  }

  return c.json({ services });
});

const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|replace|attach|detach|pragma|vacuum)\b/i;

router.post("/query", (c) => {
  return c.req.json<DebugQueryRequest>().then((body) => {
    const sql = (body.sql ?? "").trim();
    // Read-only guard: a single SELECT statement, no mutations.
    if (!/^select\b/i.test(sql)) {
      return c.json({ error: "only a single SELECT statement is allowed" }, 400);
    }
    if (sql.includes(";") && sql.indexOf(";") !== sql.length - 1) {
      return c.json({ error: "multiple statements are not allowed" }, 400);
    }
    if (FORBIDDEN.test(sql)) {
      return c.json({ error: "query contains a forbidden keyword" }, 400);
    }
    try {
      const rows = db
        .query<Record<string, unknown>, []>(sql.replace(/;\s*$/, ""))
        .all()
        .slice(0, 200);
      const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
      const body: DebugQueryResponse = { columns, rows, rowCount: rows.length };
      return c.json(body);
    } catch (err) {
      return c.json({ error: String(err) }, 400);
    }
  });
});

export default router;
