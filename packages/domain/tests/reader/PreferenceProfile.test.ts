import { describe, expect, test } from "bun:test";
import { PreferenceProfileId } from "../../src/shared.ts";
import { applyFeedback, createPreferenceProfile } from "../../src/reader/PreferenceProfile.ts";
import { createEmbedding } from "../../src/content/Embedding.ts";

const DIMENSIONS = 1024;

function makeEmbedding(value: number) {
  const vec = new Float32Array(DIMENSIONS).fill(value);
  return createEmbedding(vec, "jina-embeddings-v3");
}

describe("createPreferenceProfile", () => {
  test("initializes with zero vectors", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    expect(p.vectors.preference.every((v) => v === 0)).toBe(true);
    expect(p.articleCount).toBe(0);
  });
});

describe("applyFeedback", () => {
  test("like increases articleCount", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    const e = makeEmbedding(0.5);
    const updated = applyFeedback(p, e, "like", "preference");
    expect(updated.articleCount).toBe(1);
  });

  test("like moves preference vector toward article", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    const e = makeEmbedding(1.0);
    const updated = applyFeedback(p, e, "like", "preference");
    expect(updated.vectors.preference.some((v) => v > 0)).toBe(true);
  });

  test("dislike moves preference vector away from article", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    const e = makeEmbedding(1.0);
    const updated = applyFeedback(p, e, "dislike", "preference");
    expect(updated.vectors.preference.some((v) => v < 0)).toBe(true);
  });

  test("shareable and knowledge vectors update independently", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    const e = makeEmbedding(1.0);
    const updated = applyFeedback(p, e, "like", "shareable");
    expect(updated.vectors.shareable.some((v) => v > 0)).toBe(true);
    expect(updated.vectors.preference.every((v) => v === 0)).toBe(true);
    expect(updated.vectors.knowledge.every((v) => v === 0)).toBe(true);
  });

  test("result is immutable (original unchanged)", () => {
    const p = createPreferenceProfile(PreferenceProfileId("p1"), "default");
    const e = makeEmbedding(1.0);
    applyFeedback(p, e, "like", "preference");
    expect(p.vectors.preference.every((v) => v === 0)).toBe(true);
  });
});
