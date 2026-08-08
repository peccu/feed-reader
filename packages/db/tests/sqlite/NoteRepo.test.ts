import { beforeEach, describe, expect, test } from "bun:test";
import { ArticleId, NoteId, createArticle, createNote } from "@feed-reader/domain";
import { ArticleRepo, NoteRepo, createDatabase } from "../../src/sqlite/index.ts";

let repo: NoteRepo;
let articleRepo: ArticleRepo;

beforeEach(() => {
  const db = createDatabase();
  articleRepo = new ArticleRepo(db);
  repo = new NoteRepo(db);
});

async function seedArticle(id: string) {
  await articleRepo.save(
    createArticle({ id: ArticleId(id), url: `https://a.com/${id}`, title: id, sourceType: "rss" }),
  );
}

describe("NoteRepo", () => {
  test("save and findById", async () => {
    await seedArticle("a1");
    const note = createNote({
      id: NoteId("n1"),
      articleId: ArticleId("a1"),
      content: "great article",
      noteType: "manual",
    });
    await repo.save(note);
    const found = await repo.findById(NoteId("n1"));
    expect(found?.content).toBe("great article");
    expect(found?.claudeSessionId).toBeNull();
  });

  test("findByArticleId", async () => {
    await seedArticle("a1");
    await repo.save(
      createNote({
        id: NoteId("n1"),
        articleId: ArticleId("a1"),
        content: "x",
        noteType: "manual",
      }),
    );
    await repo.save(
      createNote({ id: NoteId("n2"), articleId: ArticleId("a1"), content: "y", noteType: "quote" }),
    );
    expect((await repo.findByArticleId(ArticleId("a1"))).length).toBe(2);
  });

  test("update changes content", async () => {
    await seedArticle("a1");
    await repo.save(
      createNote({
        id: NoteId("n1"),
        articleId: ArticleId("a1"),
        content: "old",
        noteType: "manual",
      }),
    );
    await repo.update(NoteId("n1"), "new content");
    expect((await repo.findById(NoteId("n1")))?.content).toBe("new content");
  });

  test("delete removes note", async () => {
    await seedArticle("a1");
    await repo.save(
      createNote({
        id: NoteId("n1"),
        articleId: ArticleId("a1"),
        content: "x",
        noteType: "manual",
      }),
    );
    await repo.delete(NoteId("n1"));
    expect(await repo.findById(NoteId("n1"))).toBeNull();
  });
});
