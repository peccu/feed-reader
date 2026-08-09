import { FeedId, createFeed } from "@feed-reader/domain";
import type {
  CreateFeedRequest,
  FeedResponse,
  ListResponse,
  SettingsExport,
  SettingsImportRequest,
  SettingsImportResponse,
  UpdateFeedRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { db, feedRepo, preferenceRepo } from "../db.ts";

function toResponse(
  f: Awaited<ReturnType<typeof feedRepo.findById>>,
  articleCount = 0,
): FeedResponse {
  if (!f) throw new Error("feed is null");
  return {
    id: f.id,
    url: f.url,
    title: f.title,
    description: f.description,
    pollingIntervalSeconds: f.pollingIntervalSeconds,
    lastPolledAt: f.lastPolledAt?.toISOString() ?? null,
    isActive: f.isActive,
    articleCount,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

/** Article counts per feed id. */
function articleCounts(): Map<string, number> {
  const rows = db
    .query<{ feed_id: string | null; c: number }, []>(
      "SELECT feed_id, COUNT(*) AS c FROM articles GROUP BY feed_id",
    )
    .all();
  const m = new Map<string, number>();
  for (const r of rows) if (r.feed_id) m.set(r.feed_id, r.c);
  return m;
}

const router = new Hono();

router.get("/", async (c) => {
  const feeds = await feedRepo.findAll();
  const counts = articleCounts();
  const body: ListResponse<FeedResponse> = {
    items: feeds.map((f) => toResponse(f, counts.get(f.id) ?? 0)),
    total: feeds.length,
  };
  return c.json(body);
});

// Export feeds + preference vectors as JSON (settings backup / migration).
router.get("/export", async (c) => {
  const feeds = await feedRepo.findAll();
  const profile = await preferenceRepo.findDefault();
  const body: SettingsExport = {
    version: 1,
    feeds: feeds.map((f) => ({
      url: f.url,
      title: f.title,
      description: f.description,
      pollingIntervalSeconds: f.pollingIntervalSeconds,
      isActive: f.isActive,
    })),
    preference: profile
      ? {
          name: profile.name,
          learningRate: profile.learningRate,
          vectors: {
            preference: Array.from(profile.vectors.preference),
            shareable: Array.from(profile.vectors.shareable),
            knowledge: Array.from(profile.vectors.knowledge),
          },
        }
      : null,
  };
  return c.json(body);
});

// Import feeds (skips existing by URL). Preference import is not applied.
router.post("/import", async (c) => {
  const body = await c.req.json<SettingsImportRequest>();
  let added = 0;
  let skipped = 0;
  for (const f of body.feeds ?? []) {
    if (!f.url) continue;
    const exists = db
      .query<{ c: number }, [string]>("SELECT COUNT(*) AS c FROM feeds WHERE url = ?")
      .get(f.url);
    if ((exists?.c ?? 0) > 0) {
      skipped++;
      continue;
    }
    await feedRepo.save(
      createFeed({
        id: FeedId(crypto.randomUUID()),
        url: f.url,
        title: f.title ?? f.url,
        ...(f.description != null ? { description: f.description } : {}),
        ...(f.pollingIntervalSeconds != null
          ? { pollingIntervalSeconds: f.pollingIntervalSeconds }
          : {}),
      }),
    );
    added++;
  }
  const resp: SettingsImportResponse = { added, skipped };
  return c.json(resp);
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
