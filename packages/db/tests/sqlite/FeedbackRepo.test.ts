import { beforeEach, describe, expect, test } from "bun:test";
import { ArticleId, FeedbackId, createArticle, createFeedback } from "@feed-reader/domain";
import { ArticleRepo, FeedbackRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: FeedbackRepo;
let articleRepo: ArticleRepo;

beforeEach(() => {
  const db = createDatabase();
  articleRepo = new ArticleRepo(db);
  repo = new FeedbackRepo(db);
});

async function seedArticle(id: string) {
  await articleRepo.save(
    createArticle({ id: ArticleId(id), url: `https://a.com/${id}`, title: id, sourceType: "rss" }),
  );
}

describe("FeedbackRepo", () => {
  test("save and findById", async () => {
    await seedArticle("a1");
    const fb = createFeedback({
      id: FeedbackId("fb1"),
      articleId: ArticleId("a1"),
      feedbackType: "like",
      vectorTarget: "preference",
    });
    await repo.save(fb);
    const found = await repo.findById(FeedbackId("fb1"));
    expect(found?.feedbackType).toBe("like");
    expect(found?.vectorTarget).toBe("preference");
  });

  test("findByArticleId", async () => {
    await seedArticle("a1");
    await repo.save(
      createFeedback({
        id: FeedbackId("fb1"),
        articleId: ArticleId("a1"),
        feedbackType: "dislike",
        vectorTarget: "preference",
      }),
    );
    const list = await repo.findByArticleId(ArticleId("a1"));
    expect(list.length).toBe(1);
  });

  test("findUnappliedFor returns pending feedback", async () => {
    await seedArticle("a1");
    await repo.save(
      createFeedback({
        id: FeedbackId("fb1"),
        articleId: ArticleId("a1"),
        feedbackType: "like",
        vectorTarget: "preference",
      }),
    );
    const pending = await repo.findUnappliedFor("preference");
    expect(pending.length).toBe(1);
  });

  test("markApplied clears pending", async () => {
    await seedArticle("a1");
    await repo.save(
      createFeedback({
        id: FeedbackId("fb1"),
        articleId: ArticleId("a1"),
        feedbackType: "like",
        vectorTarget: "preference",
      }),
    );
    await repo.markApplied([FeedbackId("fb1")]);
    const pending = await repo.findUnappliedFor("preference");
    expect(pending.length).toBe(0);
  });
});
