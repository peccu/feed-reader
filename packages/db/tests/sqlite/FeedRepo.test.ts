import { beforeEach, describe, expect, test } from "bun:test";
import { FeedId, createFeed } from "@feed-reader/domain";
import { FeedRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: FeedRepo;

beforeEach(() => {
  repo = new FeedRepo(createDatabase());
});

describe("FeedRepo", () => {
  test("save and findById", async () => {
    const feed = createFeed({
      id: FeedId("f1"),
      url: "https://example.com/feed.rss",
      title: "Test",
    });
    await repo.save(feed);
    const found = await repo.findById(FeedId("f1"));
    expect(found?.title).toBe("Test");
    expect(found?.isActive).toBe(true);
  });

  test("findById returns null for unknown id", async () => {
    expect(await repo.findById(FeedId("nope"))).toBeNull();
  });

  test("findAll returns all saved feeds", async () => {
    await repo.save(createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "A" }));
    await repo.save(createFeed({ id: FeedId("f2"), url: "https://b.com/rss", title: "B" }));
    expect((await repo.findAll()).length).toBe(2);
  });

  test("findActive excludes inactive feeds", async () => {
    const feed = createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "A" });
    await repo.save(feed);
    await repo.update(FeedId("f1"), { isActive: false });
    expect((await repo.findActive()).length).toBe(0);
  });

  test("update patches title", async () => {
    await repo.save(createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "Old" }));
    await repo.update(FeedId("f1"), { title: "New" });
    expect((await repo.findById(FeedId("f1")))?.title).toBe("New");
  });

  test("update patches lastPolledAt", async () => {
    const now = new Date();
    await repo.save(createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "A" }));
    await repo.update(FeedId("f1"), { lastPolledAt: now });
    const found = await repo.findById(FeedId("f1"));
    expect(found?.lastPolledAt?.getTime()).toBe(now.getTime());
  });

  test("delete removes the feed", async () => {
    await repo.save(createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "A" }));
    await repo.delete(FeedId("f1"));
    expect(await repo.findById(FeedId("f1"))).toBeNull();
  });

  test("save is idempotent (upsert)", async () => {
    const feed = createFeed({ id: FeedId("f1"), url: "https://a.com/rss", title: "A" });
    await repo.save(feed);
    await repo.save({ ...feed, title: "A2" });
    expect((await repo.findAll()).length).toBe(1);
    expect((await repo.findById(FeedId("f1")))?.title).toBe("A2");
  });
});
