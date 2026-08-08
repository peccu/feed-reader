import { describe, expect, test } from "bun:test";
import { createCategory } from "../../src/knowledge/Category.ts";
import { CategoryId } from "../../src/shared.ts";

describe("createCategory", () => {
  test("creates with defaults", () => {
    const c = createCategory({ id: CategoryId("c1"), name: "Tech" });
    expect(c.name).toBe("Tech");
    expect(c.isAutoCluster).toBe(false);
    expect(c.centroidVector).toBeNull();
    expect(c.color).toBeNull();
  });

  test("throws on empty name", () => {
    expect(() => createCategory({ id: CategoryId("c1"), name: "  " })).toThrow();
  });

  test("stores centroidVector when provided", () => {
    const vec = new Float32Array(1024).fill(0.5);
    const c = createCategory({
      id: CategoryId("c1"),
      name: "Cluster",
      centroidVector: vec,
      isAutoCluster: true,
    });
    expect(c.centroidVector).not.toBeNull();
    expect(c.isAutoCluster).toBe(true);
  });
});
