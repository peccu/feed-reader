/** jina-embeddings-v3 固定の1024次元ベクトル */
const DIMENSIONS = 1024;

export type EmbeddingModel = "jina-embeddings-v3";

export interface Embedding {
  readonly vector: Float32Array;
  readonly model: EmbeddingModel;
  readonly createdAt: Date;
}

export function createEmbedding(vector: Float32Array, model: EmbeddingModel): Embedding {
  if (vector.length !== DIMENSIONS) {
    throw new Error(`Embedding must be ${DIMENSIONS} dimensions, got ${vector.length}`);
  }
  return { vector, model, createdAt: new Date() };
}

export function cosineSimilarity(a: Embedding, b: Embedding): number {
  const av = a.vector;
  const bv = b.vector;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    dot += (av[i] ?? 0) * (bv[i] ?? 0);
    normA += (av[i] ?? 0) ** 2;
    normB += (bv[i] ?? 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** ベクトルの正規化（L2ノルム） */
export function normalize(vector: Float32Array): Float32Array {
  let norm = 0;
  for (let i = 0; i < vector.length; i++) norm += (vector[i] ?? 0) ** 2;
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  const result = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) result[i] = (vector[i] ?? 0) / norm;
  return result;
}
