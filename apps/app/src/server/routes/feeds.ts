import { FeedId, createFeed } from "@feed-reader/domain";
import type {
  CreateFeedRequest,
  FeedResponse,
  ListResponse,
  UpdateFeedRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { feedRepo } from "../db.ts";

function toResponse(f: Awaited<ReturnType<typeof feedRepo.findById>>): FeedResponse {
  if (!f) throw new Error("feed is null");
  return {
    id: f.id,
    url: f.url,
    title: f.title,
    description: f.description,
    pollingIntervalSeconds: f.pollingIntervalSeconds,
    lastPolledAt: f.lastPolledAt?.toISOString() ?? null,
    isActive: f.isActive,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

const router = new Hono();

router.get("/", async (c) => {
  const feeds = await feedRepo.findAll();
  const body: ListResponse<FeedResponse> = {
    items: feeds.map(toResponse),
    total: feeds.length,
  };
  return c.json(body);
});

router.post("/", async (c) => {
  const body = await c.req.json<CreateFeedRequest>();
  if (!body.url || !body.title) return c.json({ error: "url and title required" }, 400);
  const feed = createFeed({
    id: FeedId(crypto.randomUUID()),
    url: body.url,
    title: body.title,
    ...(body.description != null ? { description: body.description } : {}),
    ...(body.pollingIntervalSeconds != null
      ? { pollingIntervalSeconds: body.pollingIntervalSeconds }
      : {}),
  });
  await feedRepo.save(feed);
  return c.json(toResponse(feed), 201);
});

router.patch("/:id", async (c) => {
  const id = FeedId(c.req.param("id"));
  const body = await c.req.json<UpdateFeedRequest>();
  await feedRepo.update(id, body);
  const updated = await feedRepo.findById(id);
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(toResponse(updated));
});

router.delete("/:id", async (c) => {
  const id = FeedId(c.req.param("id"));
  await feedRepo.delete(id);
  return c.body(null, 204);
});

export default router;
