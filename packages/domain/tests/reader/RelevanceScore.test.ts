import { describe, expect, test } from "bun:test";
import { createRelevanceScore } from "../../src/reader/RelevanceScore.ts";

describe("createRelevanceScore", () => {
  test("0.8 → high", () => {
    const s = createRelevanceScore(0.8);
    expect(s.value).toBe(0.8);
    expect(s.label).toBe("high");
  });

  test("0.5 → medium", () => {
    const s = createRelevanceScore(0.5);
    expect(s.label).toBe("medium");
  });

  test("0.2 → low", () => {
    const s = createRelevanceScore(0.2);
    expect(s.label).toBe("low");
  });

  test("boundary 0.7 → high", () => {
    expect(createRelevanceScore(0.7).label).toBe("high");
  });

  test("boundary 0.4 → medium", () => {
    expect(createRelevanceScore(0.4).label).toBe("medium");
  });

  test("throws on value < 0", () => {
    expect(() => createRelevanceScore(-0.1)).toThrow();
  });

  test("throws on value > 1", () => {
    expect(() => createRelevanceScore(1.1)).toThrow();
  });

  test("0 and 1 are valid", () => {
    expect(() => createRelevanceScore(0)).not.toThrow();
    expect(() => createRelevanceScore(1)).not.toThrow();
  });
});
