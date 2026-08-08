/** ブランド型：IDの取り違えをコンパイル時に防ぐ */
export type Brand<T, B extends string> = T & { readonly _brand: B };

export type ArticleId = Brand<string, "ArticleId">;
export type FeedId = Brand<string, "FeedId">;
export type QueueItemId = Brand<string, "QueueItemId">;
export type PreferenceProfileId = Brand<string, "PreferenceProfileId">;
export type FeedbackId = Brand<string, "FeedbackId">;
export type NoteId = Brand<string, "NoteId">;
export type CategoryId = Brand<string, "CategoryId">;

export const ArticleId = (s: string): ArticleId => s as ArticleId;
export const FeedId = (s: string): FeedId => s as FeedId;
export const QueueItemId = (s: string): QueueItemId => s as QueueItemId;
export const PreferenceProfileId = (s: string): PreferenceProfileId => s as PreferenceProfileId;
export const FeedbackId = (s: string): FeedbackId => s as FeedbackId;
export const NoteId = (s: string): NoteId => s as NoteId;
export const CategoryId = (s: string): CategoryId => s as CategoryId;
