import { createEmbedding, normalize } from "@feed-reader/domain";
import type { Embedding } from "@feed-reader/domain";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY ?? "";
const JINA_MODEL = "jina-embeddings-v3";
const JINA_DIMENSIONS = 1024;

interface JinaResponse {
  data: Array<{ embedding: number[] }>;
}

export async function embedQuery(text: string): Promise<Embedding | null> {
  if (!JINA_API_KEY) return null;

  try {
    const res = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JINA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: JINA_MODEL,
        task: "retrieval.query",
        dimensions: JINA_DIMENSIONS,
        truncate: true,
        input: [text],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as JinaResponse;
    const raw = json.data[0]?.embedding;
    if (!raw || raw.length !== JINA_DIMENSIONS) return null;
    return createEmbedding(normalize(new Float32Array(raw)), JINA_MODEL);
  } catch {
    return null;
  }
}
