import type { CreateFeedbackRequest } from "@feed-reader/types";
import { defineStore } from "pinia";
import { api } from "../api/client.ts";

export const useFeedbackStore = defineStore("feedback", () => {
  async function sendFeedback(
    articleId: string,
    feedbackType: "like" | "dislike",
    vectorTarget: "preference" | "shareable" | "knowledge" = "preference",
  ) {
    const body: CreateFeedbackRequest = { articleId, feedbackType, vectorTarget };
    await api.post("/feedback", body);
  }

  return { sendFeedback };
});
