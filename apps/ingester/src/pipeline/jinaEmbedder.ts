import { createEmbedding, normalize } from "@feed-reader/domain";
import type { Embedding } from "@feed-reader/domain";
import { chunkText, meanPool } from "./chunk.ts";

const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY ?? "";
const JINA_MODEL = "jina-embeddings-v3";
const JINA_DIMENSIONS = 1024;
// Char budget per chunk, comfortably under the model's ~8194-token cap.
const CHUNK_CHARS = 6000;

interface JinaResponse {
  data: Array<{ embedding: number[] }>;
}

/** Embed a batch of texts, returning one normalized vector per input. */
async function embedBatch(inputs: string[]): Promise<Float32Array[]> {
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
      // Per-chunk safety net; chunking keeps inputs under the limit already.
      truncate: true,
      input: inputs,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Jina API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as JinaResponse;
  if (json.data.length !== inputs.length) {
    throw new Error(`Jina returned ${json.data.length} vectors for ${inputs.length} inputs`);
  }
  return json.data.map((d, i) => {
    const raw = d.embedding;
    if (!raw || raw.length !== JINA_DIMENSIONS) {
      throw new Error(`Unexpected Jina response shape at ${i}: ${raw?.length ?? "undefined"}`);
    }
    return normalize(new Float32Array(raw));
  });
}

/**
 * Call the Jina embeddings API and return a normalized Embedding. Long text is
 * split into chunks, each embedded, and the vectors mean-pooled so the whole
 * article contributes (rather than truncating everything past the token cap).
 */
export async function embed(text: string): Promise<Embedding> {
  if (!JINA_API_KEY) {
    // Return a (near-)zero vector in dev/test when no key is set.
    const zero = normalize(new Float32Array(JINA_DIMENSIONS).fill(0.001));
    return createEmbedding(zero, JINA_MODEL);
  }

  const chunks = chunkText(text, CHUNK_CHARS);
  const vectors = await embedBatch(chunks);
  // meanPool of a single vector just returns it, so this covers both cases.
  const pooled = normalize(meanPool(vectors));
  return createEmbedding(pooled, JINA_MODEL);
}
