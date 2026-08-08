import type { ArticleId, NoteId } from "../shared.ts";
import type { Note } from "./Note.ts";

export interface NoteRepository {
  findById(id: NoteId): Promise<Note | null>;
  findByArticleId(articleId: ArticleId): Promise<Note[]>;
  save(note: Note): Promise<void>;
  update(id: NoteId, content: string): Promise<void>;
  delete(id: NoteId): Promise<void>;
}
