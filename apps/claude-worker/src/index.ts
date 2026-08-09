import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ChatRequest,
  ChatResponse,
  SummarizeRequest,
  SummarizeResponse,
} from "@feed-reader/types";
import { spawnSync } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";

const SESSIONS_DIR = process.env.SESSIONS_DIR ?? "/data/sessions";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

/** Run claude -p with a prompt and return the output text. */
async function runClaude(prompt: string, sessionFile?: string): Promise<string> {
  const args = ["claude", "-p", prompt];
  if (sessionFile) {
    args.push("--resume", sessionFile);
  }

  const proc = spawnSync(args, {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  if (proc.exitCode !== 0) {
    const stderr = new TextDecoder().decode(proc.stderr);
    throw new Error(`claude exited with ${proc.exitCode}: ${stderr}`);
  }

  return new TextDecoder().decode(proc.stdout).trim();
}

app.post("/summarize", async (c) => {
  const body = await c.req.json<SummarizeRequest & { text?: string }>();
  const text = body.text ?? "";
  if (!text) return c.json({ error: "text required" }, 400);

  const prompt = `Summarize the following article in 2-3 sentences. Be concise.\n\n${text.slice(0, 6000)}`;

  try {
    const summary = await runClaude(prompt);
    const resp: SummarizeResponse = { summary };
    return c.json(resp);
  } catch (err) {
    console.error("[claude-worker] summarize error:", err);
    return c.json({ error: "claude unavailable" }, 503);
  }
});

app.post("/chat", async (c) => {
  const body = await c.req.json<ChatRequest>();
  const sessionId = body.sessionId ?? crypto.randomUUID();
  const sessionFile = `${SESSIONS_DIR}/${sessionId}.jsonl`;

  const contextPrefix = body.articleId ? `[Reading article: ${body.articleId}]\n\n` : "";
  const prompt = `${contextPrefix}${body.message}`;

  try {
    const content = await runClaude(prompt, body.sessionId ? sessionFile : undefined);
    const resp: ChatResponse = { sessionId, content };
    return c.json(resp);
  } catch (err) {
    console.error("[claude-worker] chat error:", err);
    return c.json({ error: "claude unavailable" }, 503);
  }
});

app.get("/sessions/:id", (c) => {
  const sessionId = c.req.param("id");
  const sessionFile = `${SESSIONS_DIR}/${sessionId}.jsonl`;
  try {
    const file = Bun.file(sessionFile);
    if (!file.size) return c.json({ error: "session not found" }, 404);
    return c.json({ sessionId, path: sessionFile });
  } catch {
    return c.json({ error: "session not found" }, 404);
  }
});

app.post("/analyze", async (c) => {
  const body = await c.req.json<AnalyzeRequest>();

  const prompt = `Extract keywords and suggest categories for the following article text.
Return a JSON object with: keywords (array of strings, max 10) and suggestedCategories (array of strings, max 5).
Only return the JSON, no explanation.

Text:
${body.text.slice(0, 4000)}`;

  try {
    const raw = await runClaude(prompt);
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no JSON in response");
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AnalyzeResponse>;
    const resp: AnalyzeResponse = {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      suggestedCategories: Array.isArray(parsed.suggestedCategories)
        ? parsed.suggestedCategories
        : [],
      summary: parsed.summary ?? "",
    };
    return c.json(resp);
  } catch (err) {
    console.error("[claude-worker] analyze error:", err);
    return c.json({ keywords: [], suggestedCategories: [], summary: "" });
  }
});

export default {
  port: Number(process.env.PORT ?? 3001),
  fetch: app.fetch,
};
