import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import articlesRouter from "./routes/articles.ts";
import categoriesRouter, { articleCategoryRouter } from "./routes/categories.ts";
import claudeRouter from "./routes/claude.ts";
import discoveryRouter, { searchRouter } from "./routes/discovery.ts";
import feedbackRouter from "./routes/feedback.ts";
import feedsRouter from "./routes/feeds.ts";
import notesRouter from "./routes/notes.ts";
import preferenceRouter from "./routes/preference.ts";
import queueRouter from "./routes/queue.ts";

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

const api = new Hono();

// Content
api.route("/feeds", feedsRouter);
api.route("/articles", articlesRouter);
api.route("/articles", discoveryRouter);

// Reader
api.route("/queue", queueRouter);
api.route("/feedback", feedbackRouter);
api.route("/preference", preferenceRouter);

// Knowledge
api.route("/categories", categoriesRouter);
api.route("/notes", notesRouter);

// Article category assignment
api.route("/articles/:articleId/categories", articleCategoryRouter);

// Claude
api.route("/claude", claudeRouter);

// Search
api.route("/search", searchRouter);

app.route("/api/v1", api);

// Serve built Vue frontend (only in production; dev uses Vite server)
// Default path matches where `bun run build` outputs relative to repo root
const distRoot = process.env.DIST_ROOT ?? "./apps/app/dist/client";
app.use("/*", serveStatic({ root: distRoot }));
app.get("/*", serveStatic({ path: `${distRoot}/index.html` }));

export { app };

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
