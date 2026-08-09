export interface CreateFeedbackRequest {
  articleId: string;
  feedbackType: "like" | "dislike";
  vectorTarget: "preference" | "shareable" | "knowledge";
}

export interface FeedbackResponse {
  id: string;
  articleId: string;
  feedbackType: "like" | "dislike";
  vectorTarget: "preference" | "shareable" | "knowledge";
  applied: boolean;
  createdAt: string;
}

export interface PreferenceResponse {
  id: string;
  name: string;
  learningRate: number;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}
