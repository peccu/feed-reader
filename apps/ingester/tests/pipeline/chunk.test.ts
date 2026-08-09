import { describe, expect, test } from "bun:test";
import { chunkText, meanPool } from "../../src/pipeline/chunk.ts";

describe("chunkText", () => {
  test("returns the text unchanged when within the budget", () => {
    expect(chunkText("short text", 100)).toEqual(["short text"]);
  });

  test("splits on paragraph boundaries and keeps every chunk within budget", () => {
    const para = "a".repeat(40);
    const text = [para, para, para].join("\n\n");
    const chunks = chunkText(text, 90);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(90);
    // No content is lost (ignoring the join whitespace).
    expect(chunks.join("").replace(/\n/g, "")).toBe("a".repeat(120));
  });

  test("hard-splits a single oversized paragraph", () => {
    const chunks = chunkText("x".repeat(250), 100);
    expect(chunks).toEqual(["x".repeat(100), "x".repeat(100), "x".repeat(50)]);
  });

  test("always returns at least one chunk", () => {
    expect(chunkText("", 100)).toEqual([""]);
  });
});

describe("meanPool", () => {
  test("averages vectors element-wise", () => {
    const a = new Float32Array([0, 2, 4]);
    const b = new Float32Array([2, 2, 8]);
    expect([...meanPool([a, b])]).toEqual([1, 2, 6]);
  });

  test("returns the same values for a single vector", () => {
    expect([...meanPool([new Float32Array([1, 2, 3])])]).toEqual([1, 2, 3]);
  });

  test("throws on empty input", () => {
    expect(() => meanPool([])).toThrow();
  });

  test("throws on a length mismatch", () => {
    expect(() => meanPool([new Float32Array([1, 2]), new Float32Array([1])])).toThrow();
  });
});
