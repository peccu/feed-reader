import { createEmbedding, normalize } from "@feed-reader/domain";
import type { Embedding } from "@feed-reader/domain";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY ?? "";
const JINA_MODEL = "jina-embeddings-v3";
const JINA_DIMENSIONS = 1024;

interface JinaResponse {
  data: Array<{ embedding: number[] }>;
}

/** Call Jina AI embeddings API and return a normalized Embedding. */
export async function embed(text: string): Promise<Embedding> {
  if (!JINA_API_KEY) {
    // Return a zero vector in dev/test when no key is set
    const zero = normalize(new Float32Array(JINA_DIMENSIONS).fill(0.001));
    return createEmbedding(zero, JINA_MODEL);
  }

  const res = await fetch(JINA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${JINA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      task: "retrieval.passage",
      dimensions: JINA_DIMENSIONS,
      // Auto-truncate inputs over the model's 8194-token limit until the
      // ingest pipeline does its own chunking/preprocessing.
      truncate: true,
      input: [text],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as JinaResponse;
  const rawVec = json.data[0]?.embedding;
  if (!rawVec || rawVec.length !== JINA_DIMENSIONS) {
    throw new Error(`Unexpected Jina response shape: ${rawVec?.length ?? "undefined"}`);
  }

  const vec = normalize(new Float32Array(rawVec));
  return createEmbedding(vec, JINA_MODEL);
}
