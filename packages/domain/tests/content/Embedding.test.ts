import { describe, expect, it } from "bun:test";
import { cosineSimilarity, createEmbedding, normalize } from "../../src/content/Embedding.ts";

const DIMENSIONS = 1024;

function makeVec(value: number): Float32Array {
  return new Float32Array(DIMENSIONS).fill(value);
}

function makeOrthogonal(): [Float32Array, Float32Array] {
  const a = new Float32Array(DIMENSIONS);
  const b = new Float32Array(DIMENSIONS);
  a[0] = 1;
  b[1] = 1;
  return [a, b];
}

describe("createEmbedding", () => {
  it("throws when dimensions are wrong", () => {
    expect(() => createEmbedding(new Float32Array(10), "jina-embeddings-v3")).toThrow();
    expect(() => createEmbedding(new Float32Array(0), "jina-embeddings-v3")).toThrow();
  });

  it("stores vector and model when dimensions correct", () => {
    const vec = makeVec(0.5);
    const emb = createEmbedding(vec, "jina-embeddings-v3");
    expect(emb.vector).toBe(vec);
    expect(emb.model).toBe("jina-embeddings-v3");
    expect(emb.createdAt).toBeInstanceOf(Date);
  });
});

describe("cosineSimilarity", () => {
  it("returns ~1.0 for identical vectors", () => {
    const emb = createEmbedding(makeVec(1.0), "jina-embeddings-v3");
    const sim = cosineSimilarity(emb, emb);
    expect(sim).toBeCloseTo(1.0, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    const [va, vb] = makeOrthogonal();
    const a = createEmbedding(va, "jina-embeddings-v3");
    const b = createEmbedding(vb, "jina-embeddings-v3");
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it("returns 0 for zero vector", () => {
    const zero = createEmbedding(new Float32Array(DIMENSIONS), "jina-embeddings-v3");
    const nonzero = createEmbedding(makeVec(1.0), "jina-embeddings-v3");
    expect(cosineSimilarity(zero, nonzero)).toBe(0);
    expect(cosineSimilarity(nonzero, zero)).toBe(0);
  });

  it("returns ~1.0 for parallel vectors (same direction)", () => {
    const a = createEmbedding(makeVec(0.3), "jina-embeddings-v3");
    const b = createEmbedding(makeVec(0.7), "jina-embeddings-v3");
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeCloseTo(1.0, 5);
  });
});

describe("normalize", () => {
  it("produces a unit-length vector", () => {
    const vec = makeVec(2.0);
    const normed = normalize(vec);
    let norm = 0;
    for (let i = 0; i < DIMENSIONS; i++) norm += (normed[i] ?? 0) ** 2;
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 5);
  });

  it("leaves a zero vector unchanged", () => {
    const zero = new Float32Array(DIMENSIONS);
    const result = normalize(zero);
    expect(result).toBe(zero);
  });

  it("preserves unit vectors (values unchanged within float precision)", () => {
    const vec = new Float32Array(DIMENSIONS);
    vec[0] = 1.0; // unit vector in first dimension
    const normed = normalize(vec);
    expect(normed[0]).toBeCloseTo(1.0, 5);
    for (let i = 1; i < DIMENSIONS; i++) {
      expect(normed[i]).toBe(0);
    }
  });
});
