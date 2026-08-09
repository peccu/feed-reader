import {
  ArticleCategoryRepo,
  ArticleRepo,
  CategoryRepo,
  EmbeddingRepo,
  FeedRepo,
  FeedbackRepo,
  NoteRepo,
  PreferenceRepo,
  QueueRepo,
  createDatabase,
  initVec,
} from "@feed-reader/db/sqlite";

const DB_PATH = process.env.DB_PATH ?? "feed-reader.db";
const db = createDatabase(DB_PATH);
initVec(db);

export const feedRepo = new FeedRepo(db);
export const articleRepo = new ArticleRepo(db);
export const queueRepo = new QueueRepo(db);
export const feedbackRepo = new FeedbackRepo(db);
export const preferenceRepo = new PreferenceRepo(db);
export const embeddingRepo = new EmbeddingRepo(db);
export const noteRepo = new NoteRepo(db);
export const categoryRepo = new CategoryRepo(db);
export const articleCategoryRepo = new ArticleCategoryRepo(db);
