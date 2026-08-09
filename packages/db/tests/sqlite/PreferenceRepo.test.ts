import { beforeEach, describe, expect, test } from "bun:test";
import {
  PreferenceProfileId,
  applyFeedback,
  createEmbedding,
  createPreferenceProfile,
} from "@feed-reader/domain";
import { PreferenceRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: PreferenceRepo;

beforeEach(() => {
  const db = createDatabase();
  // createDatabase seeds a default profile; clear it so tests control the data.
  db.run("DELETE FROM preference_vectors");
  db.run("DELETE FROM preference_profiles");
  repo = new PreferenceRepo(db);
});

function makeProfile(name = "default") {
  return createPreferenceProfile(PreferenceProfileId("p1"), name);
}

describe("PreferenceRepo", () => {
  test("save and findById", async () => {
    const p = makeProfile();
    await repo.save(p);
    const found = await repo.findById(PreferenceProfileId("p1"));
    expect(found?.name).toBe("default");
    expect(found?.articleCount).toBe(0);
  });

  test("findByName", async () => {
    await repo.save(makeProfile("default"));
    expect(await repo.findByName("default")).not.toBeNull();
    expect(await repo.findByName("other")).toBeNull();
  });

  test("findDefault returns profile named default", async () => {
    await repo.save(makeProfile("default"));
    const found = await repo.findDefault();
    expect(found?.name).toBe("default");
  });

  test("vectors are persisted and restored", async () => {
    const embedding = createEmbedding(new Float32Array(1024).fill(0.5), "jina-embeddings-v3");
    const p = applyFeedback(makeProfile(), embedding, "like", "preference");
    await repo.save(p);
    const found = await repo.findById(PreferenceProfileId("p1"));
    expect(found?.vectors.preference.some((v) => v > 0)).toBe(true);
    expect(found?.vectors.shareable.every((v) => v === 0)).toBe(true);
  });

  test("save is idempotent", async () => {
    const p = makeProfile();
    await repo.save(p);
    await repo.save({ ...p, articleCount: 5 });
    const found = await repo.findById(PreferenceProfileId("p1"));
    expect(found?.articleCount).toBe(5);
  });
});
