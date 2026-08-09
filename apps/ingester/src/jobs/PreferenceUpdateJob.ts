import { applyFeedback } from "@feed-reader/domain";
import { embeddingRepo, feedbackRepo, preferenceRepo } from "../db.ts";

const TARGETS = ["preference", "shareable", "knowledge"] as const;

/**
 * Apply unapplied feedback entries to the preference vectors (EMA update).
 * Called after debounce or on schedule.
 */
export async function runPreferenceUpdateJob(): Promise<void> {
  const profile = await preferenceRepo.findDefault();
  if (!profile) {
    console.log("[preference] no default profile, skipping");
    return;
  }

  let updated = profile;
  let totalApplied = 0;

  for (const target of TARGETS) {
    const pending = await feedbackRepo.findUnappliedFor(target);
    if (pending.length === 0) continue;

    for (const fb of pending) {
      const embedding = await embeddingRepo.findByArticleId(fb.articleId);
      if (!embedding) continue;

      updated = applyFeedback(updated, embedding, fb.feedbackType, fb.vectorTarget);
      totalApplied++;
    }

    await feedbackRepo.markApplied(pending.map((f) => f.id));
  }

  if (totalApplied > 0) {
    await preferenceRepo.save(updated);
    console.log(`[preference] applied ${totalApplied} feedback entries`);
  }
}
