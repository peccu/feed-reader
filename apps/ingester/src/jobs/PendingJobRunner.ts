import { ArticleId, QueueItemId, createQueueItem, createRelevanceScore } from "@feed-reader/domain";
import { articleRepo, db, embeddingRepo, preferenceRepo, queueRepo } from "../db.ts";
import { buildEmbeddingInput, parseHtml } from "../pipeline/htmlParser.ts";
import { ingestUrl } from "../pipeline/ingestUrl.ts";
import { embed } from "../pipeline/jinaEmbedder.ts";
import { reingestArticle } from "../pipeline/reingest.ts";

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
      } else if (job.job_type === "reingest") {
        const result = await reingestArticle(ArticleId(payload.articleId as string));
        if (!result.ok) throw new Error(`reingest failed: ${result.reason}`);
      } else if (job.job_type === "ingest_html") {
        const articleId = ArticleId(payload.articleId as string);
        const article = await articleRepo.findById(articleId);
        if (!article) throw new Error(`article ${articleId} not found`);

        const parsed = article.fullText ? parseHtml(article.fullText) : null;
        const embeddingInput = parsed ? buildEmbeddingInput(parsed) : article.title;

        let embedding: Awaited<ReturnType<typeof embed>> | null = null;
        try {
          embedding = await embed(embeddingInput);
        } catch (err) {
          console.error(`[pending] embedding failed for ${article.url}:`, err);
        }
        if (embedding) await embeddingRepo.save(articleId, embedding);

        const profile = await preferenceRepo.findDefault();
        let score = 0;
        if (profile && embedding) {
          const pref = profile.vectors.preference;
          const vec = embedding.vector;
          let dot = 0;
          let normP = 0;
          let normV = 0;
          for (let i = 0; i < pref.length; i++) {
            dot += (pref[i] ?? 0) * (vec[i] ?? 0);
            normP += (pref[i] ?? 0) ** 2;
            normV += (vec[i] ?? 0) ** 2;
          }
          const n = Math.sqrt(normP) * Math.sqrt(normV);
          score = n > 0 ? dot / n : 0;
        }

        const queueItem = createQueueItem({
          id: QueueItemId(crypto.randomUUID()),
          articleId,
          relevanceScore: createRelevanceScore(Math.max(0, Math.min(1, score))),
        });
        await queueRepo.save(queueItem);
        console.log(`[pending] html ingested: ${article.url}`);
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
