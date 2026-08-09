import { describe, expect, it } from "bun:test";
import { createFeedback } from "../../src/reader/Feedback.ts";
import { ArticleId, FeedbackId } from "../../src/shared.ts";

const baseInput = {
  id: FeedbackId("fb1"),
  articleId: ArticleId("a1"),
  feedbackType: "like" as const,
  vectorTarget: "preference" as const,
};

describe("createFeedback", () => {
  it("stores all provided fields", () => {
    const fb = createFeedback(baseInput);
    expect(fb.id).toBe(FeedbackId("fb1"));
    expect(fb.articleId).toBe(ArticleId("a1"));
    expect(fb.feedbackType).toBe("like");
    expect(fb.vectorTarget).toBe("preference");
  });

  it("sets createdAt to current time", () => {
    const before = new Date();
    const fb = createFeedback(baseInput);
    const after = new Date();
    expect(fb.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(fb.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("works with dislike feedbackType", () => {
    const fb = createFeedback({ ...baseInput, feedbackType: "dislike" });
    expect(fb.feedbackType).toBe("dislike");
  });

  it("works with all VectorTarget values", () => {
    for (const target of ["preference", "shareable", "knowledge"] as const) {
      const fb = createFeedback({ ...baseInput, vectorTarget: target });
      expect(fb.vectorTarget).toBe(target);
    }
  });
});
