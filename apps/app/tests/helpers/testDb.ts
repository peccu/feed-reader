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

export function createTestRepos() {
  const db = createDatabase(":memory:");
  initVec(db);
  return {
    db,
    feedRepo: new FeedRepo(db),
    articleRepo: new ArticleRepo(db),
    queueRepo: new QueueRepo(db),
    feedbackRepo: new FeedbackRepo(db),
    preferenceRepo: new PreferenceRepo(db),
    embeddingRepo: new EmbeddingRepo(db),
    noteRepo: new NoteRepo(db),
    categoryRepo: new CategoryRepo(db),
    articleCategoryRepo: new ArticleCategoryRepo(db),
  };
}
