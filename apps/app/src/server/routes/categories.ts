import { ArticleId, CategoryId, createCategory } from "@feed-reader/domain";
import type {
  AssignCategoryRequest,
  CategoryResponse,
  CreateCategoryRequest,
  ListResponse,
  UpdateCategoryRequest,
} from "@feed-reader/types";
import { Hono } from "hono";
import { articleCategoryRepo, categoryRepo } from "../db.ts";

function toResponse(cat: {
  id: string;
  name: string;
  description: string | null;
  isAutoCluster: boolean;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CategoryResponse {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    isAutoCluster: cat.isAutoCluster,
    color: cat.color,
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  };
}

const router = new Hono();

router.get("/", async (c) => {
  const cats = await categoryRepo.findAll();
  const body: ListResponse<CategoryResponse> = { items: cats.map(toResponse), total: cats.length };
  return c.json(body);
});

router.post("/", async (c) => {
  const body = await c.req.json<CreateCategoryRequest>();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const cat = createCategory({
    id: CategoryId(crypto.randomUUID()),
    name: body.name,
    ...(body.description != null ? { description: body.description } : {}),
    ...(body.color != null ? { color: body.color } : {}),
  });
  await categoryRepo.save(cat);
  return c.json(toResponse(cat), 201);
});

router.patch("/:id", async (c) => {
  const id = CategoryId(c.req.param("id"));
  const body = await c.req.json<UpdateCategoryRequest>();
  await categoryRepo.update(id, body);
  const updated = await categoryRepo.findById(id);
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(toResponse(updated));
});

router.delete("/:id", async (c) => {
  await categoryRepo.delete(CategoryId(c.req.param("id")));
  return c.body(null, 204);
});

// Article-category assignment (nested under /articles/:id/categories)
export const articleCategoryRouter = new Hono();

articleCategoryRouter.post("/", async (c) => {
  const rawArticleId = c.req.param("articleId");
  if (!rawArticleId) return c.json({ error: "articleId required" }, 400);
  const articleId = ArticleId(rawArticleId);
  const body = await c.req.json<AssignCategoryRequest>();
  if (!body.categoryId) return c.json({ error: "categoryId required" }, 400);
  await articleCategoryRepo.assign({
    articleId,
    categoryId: CategoryId(body.categoryId),
    assignedBy: body.assignedBy,
    assignedAt: new Date(),
  });
  return c.body(null, 204);
});

articleCategoryRouter.delete("/:categoryId", async (c) => {
  const rawArticleId = c.req.param("articleId");
  const rawCategoryId = c.req.param("categoryId");
  if (!rawArticleId || !rawCategoryId) return c.json({ error: "params required" }, 400);
  await articleCategoryRepo.unassign(ArticleId(rawArticleId), CategoryId(rawCategoryId));
  return c.body(null, 204);
});

export default router;
