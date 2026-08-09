export interface SummarizeRequest {
  articleId: string;
}

export interface SummarizeResponse {
  summary: string;
}

export interface ChatRequest {
  sessionId?: string;
  message: string;
  articleId?: string;
}

export interface ChatResponse {
  sessionId: string;
  content: string;
}

export interface CreateNoteFromChatRequest {
  sessionId: string;
  content: string;
  articleId: string;
}

export interface AnalyzeRequest {
  articleId: string;
  text: string;
}

export interface AnalyzeResponse {
  keywords: string[];
  suggestedCategories: string[];
  summary: string;
}
