import { ArticleId, FeedbackId, createFeedback } from "@feed-reader/domain";
import type { CreateFeedbackRequest, FeedbackResponse } from "@feed-reader/types";
import { Hono } from "hono";
import { feedbackRepo } from "../db.ts";

function toResponse(f: {
  id: string;
  articleId: string;
  feedbackType: "like" | "dislike";
  vectorTarget: "preference" | "shareable" | "knowledge";
  createdAt: Date;
}): FeedbackResponse {
  return {
    id: f.id,
    articleId: f.articleId,
    feedbackType: f.feedbackType,
    vectorTarget: f.vectorTarget,
    applied: false,
    createdAt: f.createdAt.toISOString(),
  };
}

const router = new Hono();

router.post("/", async (c) => {
  const body = await c.req.json<CreateFeedbackRequest>();
  if (!body.articleId || !body.feedbackType || !body.vectorTarget) {
    return c.json({ error: "articleId, feedbackType, and vectorTarget required" }, 400);
  }
  const feedback = createFeedback({
    id: FeedbackId(crypto.randomUUID()),
    articleId: ArticleId(body.articleId),
    feedbackType: body.feedbackType,
    vectorTarget: body.vectorTarget,
  });
  await feedbackRepo.save(feedback);
  return c.json(toResponse(feedback), 201);
});

export default router;
