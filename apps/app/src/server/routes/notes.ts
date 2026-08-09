import { ArticleId, NoteId, createNote } from "@feed-reader/domain";
import type {
  CreateNoteRequest,
  ListResponse,
  NoteResponse,
  UpdateNoteRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { noteRepo } from "../db.ts";

function toResponse(n: {
  id: string;
  articleId: string;
  content: string;
  noteType: "manual" | "claude_conversation" | "quote";
  claudeSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NoteResponse {
  return {
    id: n.id,
    articleId: n.articleId,
    content: n.content,
    noteType: n.noteType,
    claudeSessionId: n.claudeSessionId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

const router = new Hono();

router.get("/", async (c) => {
  const articleId = c.req.query("articleId");
  const notes = articleId ? await noteRepo.findByArticleId(ArticleId(articleId)) : [];
  const body: ListResponse<NoteResponse> = { items: notes.map(toResponse), total: notes.length };
  return c.json(body);
});

router.post("/", async (c) => {
  const body = await c.req.json<CreateNoteRequest>();
  if (!body.articleId || !body.content || !body.noteType) {
    return c.json({ error: "articleId, content, and noteType required" }, 400);
  }
  const note = createNote({
    id: NoteId(crypto.randomUUID()),
    articleId: ArticleId(body.articleId),
    content: body.content,
    noteType: body.noteType,
    ...(body.claudeSessionId != null ? { claudeSessionId: body.claudeSessionId } : {}),
  });
  await noteRepo.save(note);
  return c.json(toResponse(note), 201);
});

router.get("/:id", async (c) => {
  const note = await noteRepo.findById(NoteId(c.req.param("id")));
  if (!note) return c.json({ error: "not found" }, 404);
  return c.json(toResponse(note));
});

router.patch("/:id", async (c) => {
  const id = NoteId(c.req.param("id"));
  const body = await c.req.json<UpdateNoteRequest>();
  if (!body.content) return c.json({ error: "content required" }, 400);
  await noteRepo.update(id, body.content);
  const updated = await noteRepo.findById(id);
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(toResponse(updated));
});

router.delete("/:id", async (c) => {
  await noteRepo.delete(NoteId(c.req.param("id")));
  return c.body(null, 204);
});

export default router;
