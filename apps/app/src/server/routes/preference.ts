import type { PreferenceResponse } from "@feed-reader/types";
import { Hono } from "hono";
import { preferenceRepo } from "../db.ts";

const router = new Hono();

router.get("/", async (c) => {
  const profile = await preferenceRepo.findDefault();
  if (!profile) return c.json({ error: "no preference profile found" }, 404);
  const body: PreferenceResponse = {
    id: profile.id,
    name: profile.name,
    learningRate: profile.learningRate,
    articleCount: profile.articleCount,
    createdAt: profile.updatedAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
  return c.json(body);
});

export default router;
