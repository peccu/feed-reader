import { beforeEach, describe, expect, test } from "bun:test";
import {
  ArticleId,
  FeedbackId,
  QueueItemId,
  createArticle,
  createFeedback,
  createQueueItem,
  createRelevanceScore,
} from "@feed-reader/domain";
import { ArticleRepo, FeedbackRepo, QueueRepo, createDatabase } from "../../src/sqlite/index.ts";

let queueRepo: QueueRepo;
let articleRepo: ArticleRepo;
let feedbackRepo: FeedbackRepo;

beforeEach(() => {
  const db = createDatabase();
  articleRepo = new ArticleRepo(db);
  queueRepo = new QueueRepo(db);
  feedbackRepo = new FeedbackRepo(db);
});

async function seedArticle(id: string) {
  await articleRepo.save(
    createArticle({ id: ArticleId(id), url: `https://a.com/${id}`, title: id, sourceType: "rss" }),
  );
}

function makeItem(id: string, articleId: string, score = 0.5) {
  return createQueueItem({
    id: QueueItemId(id),
    articleId: ArticleId(articleId),
    relevanceScore: createRelevanceScore(score),
  });
}

describe("QueueRepo", () => {
  test("save and findById", async () => {
    await seedArticle("a1");
    const item = makeItem("q1", "a1");
    await queueRepo.save(item);
    const found = await queueRepo.findById(QueueItemId("q1"));
    expect(found?.status).toBe("unread");
    expect(found?.relevanceScore.value).toBe(0.5);
  });

  test("findByArticleId", async () => {
    await seedArticle("a1");
    await queueRepo.save(makeItem("q1", "a1"));
    const found = await queueRepo.findByArticleId(ArticleId("a1"));
    expect(found?.id).toBe(QueueItemId("q1"));
  });

  test("countByStatus", async () => {
    await seedArticle("a1");
    await seedArticle("a2");
    await queueRepo.save(makeItem("q1", "a1"));
    await queueRepo.save(makeItem("q2", "a2"));
    expect(await queueRepo.countByStatus("unread")).toBe(2);
    expect(await queueRepo.countByStatus("read")).toBe(0);
  });

  test("findMany filter by status", async () => {
    await seedArticle("a1");
    await seedArticle("a2");
    await queueRepo.save(makeItem("q1", "a1"));
    await queueRepo.save(makeItem("q2", "a2"));
    await queueRepo.updateStatus(QueueItemId("q1"), "reading");
    const unread = await queueRepo.findMany({ status: "unread" });
    expect(unread.length).toBe(1);
  });

  test("updateStatus sets readAt when read", async () => {
    await seedArticle("a1");
    await queueRepo.save(makeItem("q1", "a1"));
    const readAt = new Date();
    await queueRepo.updateStatus(QueueItemId("q1"), "read", readAt);
    const found = await queueRepo.findById(QueueItemId("q1"));
    expect(found?.status).toBe("read");
    expect(found?.readAt?.getTime()).toBe(readAt.getTime());
  });

  test("updateRelevanceScore", async () => {
    await seedArticle("a1");
    await queueRepo.save(makeItem("q1", "a1", 0.3));
    await queueRepo.updateRelevanceScore(QueueItemId("q1"), 0.9);
    const found = await queueRepo.findById(QueueItemId("q1"));
    expect(found?.relevanceScore.value).toBeCloseTo(0.9);
  });

  test("findBorderline orders by distance from 0.5 and excludes evaluated items", async () => {
    await seedArticle("a1");
    await seedArticle("a2");
    await seedArticle("a3");
    // a2 is closest to the 0.5 boundary, a1 next, a3 furthest.
    await queueRepo.save(makeItem("q1", "a1", 0.4));
    await queueRepo.save(makeItem("q2", "a2", 0.52));
    await queueRepo.save(makeItem("q3", "a3", 0.95));

    const before = await queueRepo.findBorderline();
    expect(before.map((r) => r.item.articleId)).toEqual([
      ArticleId("a2"),
      ArticleId("a1"),
      ArticleId("a3"),
    ]);

    // Once the most-borderline article is evaluated, it drops out of training.
    await feedbackRepo.save(
      createFeedback({
        id: FeedbackId("fb1"),
        articleId: ArticleId("a2"),
        feedbackType: "like",
        vectorTarget: "preference",
      }),
    );
    const after = await queueRepo.findBorderline();
    expect(after.map((r) => r.item.articleId)).toEqual([ArticleId("a1"), ArticleId("a3")]);
  });
});
