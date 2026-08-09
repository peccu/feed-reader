import { describe, expect, it } from "bun:test";
import { buildEmbeddingText, createArticle } from "../../src/content/Article.ts";
import { ArticleId, FeedId } from "../../src/shared.ts";

const baseInput = {
  id: ArticleId("a1"),
  url: "https://example.com/article",
  title: "Test Article",
  sourceType: "rss" as const,
};

describe("createArticle", () => {
  it("sets defaults when only required fields given", () => {
    const article = createArticle(baseInput);
    expect(article.summary).toBeNull();
    expect(article.scrapedAt).toBeNull();
    expect(article.wordCount).toBeNull();
    expect(article.feedId).toBeNull();
    expect(article.author).toBeNull();
    expect(article.publishedAt).toBeNull();
    // Article has no isActive field (that's Feed)
  });

  it("computes wordCount and sets scrapedAt when fullText provided", () => {
    const article = createArticle({ ...baseInput, fullText: "hello world foo" });
    expect(article.wordCount).toBe(3);
    expect(article.scrapedAt).not.toBeNull();
    expect(article.fullText).toBe("hello world foo");
  });

  it("throws for non-http/https URL", () => {
    expect(() => createArticle({ ...baseInput, url: "ftp://example.com" })).toThrow();
    expect(() => createArticle({ ...baseInput, url: "example.com" })).toThrow();
  });

  it("accepts http URLs", () => {
    const article = createArticle({ ...baseInput, url: "http://example.com" });
    expect(article.url).toBe("http://example.com");
  });

  it("stores optional feedId", () => {
    const article = createArticle({ ...baseInput, feedId: FeedId("f1") });
    expect(article.feedId).toBe(FeedId("f1"));
  });
});

describe("buildEmbeddingText", () => {
  it("returns 'title\\n\\nbody' when fullText present", () => {
    const article = createArticle({ ...baseInput, fullText: "body content here" });
    expect(buildEmbeddingText(article)).toBe("Test Article\n\nbody content here");
  });

  it("returns just title when fullText absent", () => {
    const article = createArticle(baseInput);
    expect(buildEmbeddingText(article)).toBe("Test Article");
  });
});
