const CLAUDE_WORKER_URL = process.env.CLAUDE_WORKER_URL ?? "http://claude-worker:3001";
const MAX_ENRICHMENT_CHARS = 8000;

export interface EnrichResult {
  keywords: string[];
  suggestedCategories: string[];
}

/**
 * Optionally call claude-worker to extract keywords from article text.
 * Returns empty result if claude-worker is unavailable or ENABLE_CLAUDE_ENRICHMENT is not set.
 */
export async function enrichWithClaude(articleId: string, text: string): Promise<EnrichResult> {
  if (!process.env.ENABLE_CLAUDE_ENRICHMENT) {
    return { keywords: [], suggestedCategories: [] };
  }

  try {
    const res = await fetch(`${CLAUDE_WORKER_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        text: text.slice(0, MAX_ENRICHMENT_CHARS),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { keywords: [], suggestedCategories: [] };
    return (await res.json()) as EnrichResult;
  } catch {
    return { keywords: [], suggestedCategories: [] };
  }
}
