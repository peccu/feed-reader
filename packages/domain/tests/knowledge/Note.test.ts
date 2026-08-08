import { describe, expect, test } from "bun:test";
import { ArticleId, NoteId } from "../../src/shared.ts";
import { createNote } from "../../src/knowledge/Note.ts";

describe("createNote", () => {
  test("creates a note with content", () => {
    const note = createNote({
      id: NoteId("n1"),
      articleId: ArticleId("a1"),
      content: "interesting point",
      noteType: "manual",
    });
    expect(note.content).toBe("interesting point");
    expect(note.claudeSessionId).toBeNull();
  });

  test("throws on empty content", () => {
    expect(() =>
      createNote({
        id: NoteId("n1"),
        articleId: ArticleId("a1"),
        content: "   ",
        noteType: "manual",
      }),
    ).toThrow();
  });

  test("stores claudeSessionId when provided", () => {
    const note = createNote({
      id: NoteId("n1"),
      articleId: ArticleId("a1"),
      content: "summary",
      noteType: "claude_conversation",
      claudeSessionId: "session-123",
    });
    expect(note.claudeSessionId).toBe("session-123");
  });
});
