import { describe, expect, test } from "bun:test";
import { createQueueItem, transitionStatus } from "../../src/reader/QueueItem.ts";
import { createRelevanceScore } from "../../src/reader/RelevanceScore.ts";
import { ArticleId, QueueItemId } from "../../src/shared.ts";

const makeItem = () =>
  createQueueItem({
    id: QueueItemId("q1"),
    articleId: ArticleId("a1"),
    relevanceScore: createRelevanceScore(0.8),
  });

describe("createQueueItem", () => {
  test("initial status is unread", () => {
    expect(makeItem().status).toBe("unread");
  });

  test("readAt is null initially", () => {
    expect(makeItem().readAt).toBeNull();
  });
});

describe("transitionStatus", () => {
  test("unread → reading", () => {
    const item = transitionStatus(makeItem(), "reading");
    expect(item.status).toBe("reading");
  });

  test("reading → read sets readAt", () => {
    const reading = transitionStatus(makeItem(), "reading");
    const read = transitionStatus(reading, "read");
    expect(read.status).toBe("read");
    expect(read.readAt).toBeInstanceOf(Date);
  });

  test("skipped → unread (undo)", () => {
    const skipped = transitionStatus(makeItem(), "skipped");
    const restored = transitionStatus(skipped, "unread");
    expect(restored.status).toBe("unread");
  });

  test("invalid transition throws", () => {
    const reading = transitionStatus(makeItem(), "reading");
    expect(() => transitionStatus(reading, "unread")).toThrow();
  });

  test("archived → unread throws", () => {
    const item = transitionStatus(transitionStatus(makeItem(), "reading"), "read");
    const archived = transitionStatus(item, "archived");
    expect(() => transitionStatus(archived, "unread")).toThrow();
  });
});
