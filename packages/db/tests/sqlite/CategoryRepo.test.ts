import { beforeEach, describe, expect, test } from "bun:test";
import { CategoryId, createCategory } from "@feed-reader/domain";
import { CategoryRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: CategoryRepo;

beforeEach(() => {
  repo = new CategoryRepo(createDatabase());
});

describe("CategoryRepo", () => {
  test("save and findById", async () => {
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Tech" }));
    const found = await repo.findById(CategoryId("c1"));
    expect(found?.name).toBe("Tech");
    expect(found?.isAutoCluster).toBe(false);
    expect(found?.centroidVector).toBeNull();
  });

  test("findAll", async () => {
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Tech" }));
    await repo.save(createCategory({ id: CategoryId("c2"), name: "Science" }));
    expect((await repo.findAll()).length).toBe(2);
  });

  test("findAutoCluster returns only auto categories", async () => {
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Manual" }));
    await repo.save(createCategory({ id: CategoryId("c2"), name: "Auto", isAutoCluster: true }));
    const auto = await repo.findAutoCluster();
    expect(auto.length).toBe(1);
    expect(auto[0]?.name).toBe("Auto");
  });

  test("update patches name", async () => {
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Old" }));
    await repo.update(CategoryId("c1"), { name: "New" });
    expect((await repo.findById(CategoryId("c1")))?.name).toBe("New");
  });

  test("centroidVector round-trips correctly", async () => {
    const vec = new Float32Array(1024).fill(0.42);
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Cluster", centroidVector: vec }));
    const found = await repo.findById(CategoryId("c1"));
    expect(found?.centroidVector?.length).toBe(1024);
    expect(found?.centroidVector?.[0]).toBeCloseTo(0.42);
  });

  test("delete removes category", async () => {
    await repo.save(createCategory({ id: CategoryId("c1"), name: "Tech" }));
    await repo.delete(CategoryId("c1"));
    expect(await repo.findById(CategoryId("c1"))).toBeNull();
  });
});
