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

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

// Session IDs we've seen returned by the CLI, so /sessions/:id can report
// whether a conversation exists (the CLI owns the actual transcript store).
const knownSessions = new Set<string>();

export interface ClaudeResult {
  text: string;
  sessionId: string | null;
}

/**
 * Parse the stdout of `claude -p --output-format json`. That prints a single
 * JSON object with the assistant text in `result` and the real conversation id
 * in `session_id`. Falls back to treating the output as plain text if it isn't
 * JSON (older CLIs / `--output-format text`).
 */
export function parseClaudeResult(stdout: string): ClaudeResult {
  const trimmed = stdout.trim();
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    const text = obj.result ?? obj.text ?? obj.content;
    const sessionId = obj.session_id ?? obj.sessionId;
    return {
      text: typeof text === "string" ? text : trimmed,
      sessionId: typeof sessionId === "string" ? sessionId : null,
    };
  } catch {
    return { text: trimmed, sessionId: null };
  }
}

/**
 * Run `claude -p` and return the assistant text plus the CLI session id.
 * Pass `resumeSessionId` (a real session id, not a file) to continue a
 * conversation.
 */
async function runClaude(prompt: string, resumeSessionId?: string): Promise<ClaudeResult> {
  const args = ["claude", "-p", prompt, "--output-format", "json"];
  if (resumeSessionId) {
    args.push("--resume", resumeSessionId);
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

  const result = parseClaudeResult(new TextDecoder().decode(proc.stdout));
  if (result.sessionId) knownSessions.add(result.sessionId);
  return result;
}

app.post("/summarize", async (c) => {
  const body = await c.req.json<SummarizeRequest & { text?: string }>();
  const text = body.text ?? "";
  if (!text) return c.json({ error: "text required" }, 400);

  const prompt = `Summarize the following article in 2-3 sentences. Be concise.\n\n${text.slice(0, 6000)}`;

  try {
    const { text: summary } = await runClaude(prompt);
    const resp: SummarizeResponse = { summary };
    return c.json(resp);
  } catch (err) {
    console.error("[claude-worker] summarize error:", err);
    return c.json({ error: "claude unavailable" }, 503);
  }
});

app.post("/chat", async (c) => {
  const body = await c.req.json<ChatRequest>();

  const contextPrefix = body.articleId ? `[Reading article: ${body.articleId}]\n\n` : "";
  const prompt = `${contextPrefix}${body.message}`;

  try {
    // Resume by the real session id from a previous turn (if any).
    const { text, sessionId } = await runClaude(prompt, body.sessionId);
    const resp: ChatResponse = {
      // Prefer the CLI's session id; fall back to the incoming one.
      sessionId: sessionId ?? body.sessionId ?? crypto.randomUUID(),
      content: text,
    };
    return c.json(resp);
  } catch (err) {
    console.error("[claude-worker] chat error:", err);
    return c.json({ error: "claude unavailable" }, 503);
  }
});

app.get("/sessions/:id", (c) => {
  const sessionId = c.req.param("id");
  if (!knownSessions.has(sessionId)) return c.json({ error: "session not found" }, 404);
  return c.json({ sessionId });
});

app.post("/analyze", async (c) => {
  const body = await c.req.json<AnalyzeRequest>();

  const prompt = `Extract keywords and suggest categories for the following article text.
Return a JSON object with: keywords (array of strings, max 10) and suggestedCategories (array of strings, max 5).
Only return the JSON, no explanation.

Text:
${body.text.slice(0, 4000)}`;

  try {
    const { text: raw } = await runClaude(prompt);
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
