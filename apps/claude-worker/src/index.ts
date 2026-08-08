import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));

export default {
  port: 3001,
  fetch: app.fetch,
};
