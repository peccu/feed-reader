import { beforeEach, describe, expect, test } from "bun:test";
import { ArticleId, FeedId, createArticle, createFeed } from "@feed-reader/domain";
import { ArticleRepo, FeedRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: ArticleRepo;
let feedRepo: FeedRepo;

beforeEach(() => {
  const db = createDatabase();
  repo = new ArticleRepo(db);
  feedRepo = new FeedRepo(db);
});

function makeArticle(id: string, url: string) {
  return createArticle({
    id: ArticleId(id),
    url,
    title: `Article ${id}`,
    sourceType: "rss",
  });
}

describe("ArticleRepo", () => {
  test("save and findById", async () => {
    const a = makeArticle("a1", "https://example.com/1");
    await repo.save(a);
    const found = await repo.findById(ArticleId("a1"));
    expect(found?.title).toBe("Article a1");
    expect(found?.feedId).toBeNull();
  });

  test("findByUrl", async () => {
    await repo.save(makeArticle("a1", "https://example.com/1"));
    const found = await repo.findByUrl("https://example.com/1");
    expect(found?.id).toBe(ArticleId("a1"));
  });

  test("existsByUrl returns true when exists", async () => {
    await repo.save(makeArticle("a1", "https://example.com/1"));
    expect(await repo.existsByUrl("https://example.com/1")).toBe(true);
  });

  test("existsByUrl returns false when absent", async () => {
    expect(await repo.existsByUrl("https://example.com/nope")).toBe(false);
  });

  test("findMany without filter returns all", async () => {
    await repo.save(makeArticle("a1", "https://a.com/1"));
    await repo.save(makeArticle("a2", "https://a.com/2"));
    expect((await repo.findMany()).length).toBe(2);
  });

  test("findMany filter by sourceType", async () => {
    await repo.save(makeArticle("a1", "https://a.com/1"));
    await repo.save(
      createArticle({ id: ArticleId("a2"), url: "https://b.com/2", title: "B", sourceType: "url" }),
    );
    const rss = await repo.findMany({ sourceType: "rss" });
    expect(rss.length).toBe(1);
    expect(rss[0]?.id).toBe(ArticleId("a1"));
  });

  test("update patches summary and fullText", async () => {
    await repo.save(makeArticle("a1", "https://a.com/1"));
    await repo.update(ArticleId("a1"), { summary: "short", fullText: "long text" });
    const found = await repo.findById(ArticleId("a1"));
    expect(found?.summary).toBe("short");
    expect(found?.fullText).toBe("long text");
  });

  test("preserves feedId when set", async () => {
    await feedRepo.save(createFeed({ id: FeedId("f1"), url: "https://feed.com/rss", title: "F" }));
    const a = createArticle({
      id: ArticleId("a1"),
      url: "https://a.com/1",
      title: "A",
      sourceType: "rss",
      feedId: FeedId("f1"),
    });
    await repo.save(a);
    const found = await repo.findById(ArticleId("a1"));
    expect(found?.feedId).toBe(FeedId("f1"));
  });
});
