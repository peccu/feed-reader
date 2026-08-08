import type { Database } from "bun:sqlite";
import type { ArticleId, Note, NoteId, NoteRepository, NoteType } from "@feed-reader/domain";
import { ArticleId as mkArticleId, NoteId as mkNoteId } from "@feed-reader/domain";

type NoteRow = {
  id: string;
  article_id: string;
  content: string;
  note_type: string;
  claude_session_id: string | null;
  created_at: number;
  updated_at: number;
};

function toNote(r: NoteRow): Note {
  return {
    id: mkNoteId(r.id),
    articleId: mkArticleId(r.article_id),
    content: r.content,
    noteType: r.note_type as NoteType,
    claudeSessionId: r.claude_session_id,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class NoteRepo implements NoteRepository {
  constructor(private readonly db: Database) {}

  async findById(id: NoteId): Promise<Note | null> {
    const row =
      this.db.query<NoteRow, [string]>("SELECT * FROM notes WHERE id = ?").get(id) ?? null;
    return row ? toNote(row) : null;
  }

  async findByArticleId(articleId: ArticleId): Promise<Note[]> {
    return this.db
      .query<NoteRow, [string]>("SELECT * FROM notes WHERE article_id = ? ORDER BY created_at ASC")
      .all(articleId)
      .map(toNote);
  }

  async save(note: Note): Promise<void> {
    this.db.run(
      `INSERT INTO notes (id, article_id, content, note_type, claude_session_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         content = excluded.content, updated_at = excluded.updated_at`,
      [
        note.id,
        note.articleId,
        note.content,
        note.noteType,
        note.claudeSessionId,
        note.createdAt.getTime(),
        note.updatedAt.getTime(),
      ],
    );
  }

  async update(id: NoteId, content: string): Promise<void> {
    this.db.run("UPDATE notes SET content = ?, updated_at = ? WHERE id = ?", [
      content,
      Date.now(),
      id,
    ]);
  }

  async delete(id: NoteId): Promise<void> {
    this.db.run("DELETE FROM notes WHERE id = ?", [id]);
  }
}
