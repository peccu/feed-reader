export interface IngestUrlRequest {
  url: string;
}

export interface IngestHtmlRequest {
  url: string;
  html: string;
  title?: string;
}

export interface ArticleListQuery {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ArticleResponse {
  id: string;
  feedId: string | null;
  url: string;
  title: string;
  author: string | null;
  summary: string | null;
  publishedAt: string | null;
  sourceType: string;
  wordCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetailResponse extends ArticleResponse {
  fullText: string | null;
  html: string | null;
  leadImageUrl: string | null;
  /** Title of the source feed (for RSS articles), if any. */
  feedTitle: string | null;
}

export interface SimilarArticleResponse {
  articleId: string;
  similarity: number;
}

export interface IngestJobResponse {
  jobId: string;
}
