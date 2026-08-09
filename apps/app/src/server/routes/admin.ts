import type { AdminStatsResponse, PendingJobResponse } from "@feed-reader/types";
import { Hono } from "hono";
import { db } from "../db.ts";

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
  };
  return c.json(body);
});

router.get("/jobs", (c) => {
  const limit = Number(c.req.query("limit") ?? 30);
  const rows = db
    .query<
      {
        id: string;
        job_type: string;
        status: string;
        payload: string;
        error: string | null;
        created_at: number;
        updated_at: number;
      },
      [number]
    >(
      "SELECT id, job_type, status, payload, error, created_at, updated_at FROM pending_jobs ORDER BY created_at DESC LIMIT ?",
    )
    .all(limit);
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

export default router;
