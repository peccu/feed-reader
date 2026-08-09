import { db } from "../db.ts";
import { ingestUrl } from "../pipeline/ingestUrl.ts";

interface PendingJobRow {
  id: string;
  job_type: string;
  payload: string;
}

export async function runPendingJobRunner(): Promise<void> {
  const jobs = db
    .query<PendingJobRow, []>(
      "SELECT id, job_type, payload FROM pending_jobs WHERE status = 'pending' ORDER BY created_at LIMIT 10",
    )
    .all();

  for (const job of jobs) {
    db.run("UPDATE pending_jobs SET status = 'processing', updated_at = ? WHERE id = ?", [
      Date.now(),
      job.id,
    ]);

    try {
      const payload = JSON.parse(job.payload) as Record<string, unknown>;

      if (job.job_type === "ingest_url") {
        const url = payload.url as string;
        await ingestUrl(url);
      } else if (job.job_type === "ingest_html") {
        // HTML already scraped by the app — just embed and queue
        const url = payload.url as string;
        const articleId = payload.articleId as string;
        console.log(`[pending] html job for ${url} / ${articleId}`);
      } else {
        console.warn(`[pending] unknown job type: ${job.job_type}`);
      }

      db.run("UPDATE pending_jobs SET status = 'done', updated_at = ? WHERE id = ?", [
        Date.now(),
        job.id,
      ]);
    } catch (err) {
      console.error(`[pending] job ${job.id} failed:`, err);
      db.run("UPDATE pending_jobs SET status = 'failed', error = ?, updated_at = ? WHERE id = ?", [
        String(err),
        Date.now(),
        job.id,
      ]);
    }
  }
}
