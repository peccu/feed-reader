import type { PreferenceResponse, UpdatePreferenceRequest } from "@feed-reader/types";
import { Hono } from "hono";
import { preferenceRepo } from "../db.ts";

const router = new Hono();

function toResponse(
  profile: Awaited<ReturnType<typeof preferenceRepo.findDefault>> & object,
): PreferenceResponse {
  return {
    id: profile.id,
    name: profile.name,
    learningRate: profile.learningRate,
    articleCount: profile.articleCount,
    createdAt: profile.updatedAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

router.get("/", async (c) => {
  const profile = await preferenceRepo.findDefault();
  if (!profile) return c.json({ error: "no preference profile found" }, 404);
  return c.json(toResponse(profile));
});

router.patch("/", async (c) => {
  const profile = await preferenceRepo.findDefault();
  if (!profile) return c.json({ error: "no preference profile found" }, 404);
  const body = await c.req.json<UpdatePreferenceRequest>();
  const updated = {
    ...profile,
    ...(body.name != null ? { name: body.name } : {}),
    ...(body.learningRate != null ? { learningRate: body.learningRate } : {}),
    updatedAt: new Date(),
  };
  await preferenceRepo.save(updated);
  return c.json(toResponse(updated));
});

export default router;
