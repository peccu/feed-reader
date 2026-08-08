import type { ArticleId, NoteId } from "../shared.ts";
import type { NoteType } from "./NoteType.ts";

export interface Note {
  readonly id: NoteId;
  readonly articleId: ArticleId;
  readonly content: string;
  readonly noteType: NoteType;
  readonly claudeSessionId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateNoteInput {
  id: NoteId;
  articleId: ArticleId;
  content: string;
  noteType: NoteType;
  claudeSessionId?: string;
}

export function createNote(input: CreateNoteInput): Note {
  if (!input.content.trim()) throw new Error("Note content cannot be empty");
  const now = new Date();
  return {
    id: input.id,
    articleId: input.articleId,
    content: input.content,
    noteType: input.noteType,
    claudeSessionId: input.claudeSessionId ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
