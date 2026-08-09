import { ArticleId, NoteId, createNote } from "@feed-reader/domain";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  CreateNoteFromChatRequest,
  NoteResponse,
  SummarizeRequest,
  SummarizeResponse,
} from "@feed-reader/types";
import { Hono } from "hono";
import { articleRepo, noteRepo } from "../db.ts";
import { CLAUDE_WORKER_URL } from "./articles.ts";

async function callWorker<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CLAUDE_WORKER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`claude-worker ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

const router = new Hono();

router.post("/summarize", async (c) => {
  const body = await c.req.json<SummarizeRequest>();
  const article = await articleRepo.findById(ArticleId(body.articleId));
  if (!article) return c.json({ error: "article not found" }, 404);
  const result = await callWorker<SummarizeResponse>("/summarize", {
    articleId: body.articleId,
    text: article.fullText ?? article.title,
  });
  await articleRepo.update(ArticleId(body.articleId), { summary: result.summary });
  return c.json(result);
});

router.post("/chat", async (c) => {
  const body = await c.req.json<ChatRequest>();
  const result = await callWorker<ChatResponse>("/chat", body);
  return c.json(result);
});

router.get("/sessions/:id", async (c) => {
  const sessionId = c.req.param("id");
  const res = await fetch(`${CLAUDE_WORKER_URL}/sessions/${sessionId}`);
  if (!res.ok) return c.json({ error: "session not found" }, 404);
  return c.json(await res.json());
});

router.post("/note", async (c) => {
  const body = await c.req.json<CreateNoteFromChatRequest>();
  const note = createNote({
    id: NoteId(crypto.randomUUID()),
    articleId: ArticleId(body.articleId),
    content: body.content,
    noteType: "claude_conversation",
    claudeSessionId: body.sessionId,
  });
  await noteRepo.save(note);
  const resp: NoteResponse = {
    id: note.id,
    articleId: note.articleId,
    content: note.content,
    noteType: note.noteType,
    claudeSessionId: note.claudeSessionId,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
  return c.json(resp, 201);
});

// Internal: called by ingester
router.post("/analyze", async (c) => {
  const body = await c.req.json<AnalyzeRequest>();
  const result = await callWorker<AnalyzeResponse>("/analyze", body);
  return c.json(result);
});

export default router;
