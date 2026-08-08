import type { Database } from "bun:sqlite";
import type { Category, CategoryId, CategoryRepository } from "@feed-reader/domain";
import { CategoryId as mkCategoryId } from "@feed-reader/domain";
import { patchRow } from "./client.ts";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  is_auto_cluster: number;
  centroid_vector: Uint8Array | null;
  color: string | null;
  created_at: number;
  updated_at: number;
};

function toCategory(r: CategoryRow): Category {
  return {
    id: mkCategoryId(r.id),
    name: r.name,
    description: r.description,
    isAutoCluster: r.is_auto_cluster === 1,
    centroidVector:
      r.centroid_vector !== null
        ? new Float32Array(
            r.centroid_vector.buffer,
            r.centroid_vector.byteOffset,
            r.centroid_vector.byteLength / 4,
          )
        : null,
    color: r.color,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export class CategoryRepo implements CategoryRepository {
  constructor(private readonly db: Database) {}

  async findById(id: CategoryId): Promise<Category | null> {
    const row =
      this.db.query<CategoryRow, [string]>("SELECT * FROM categories WHERE id = ?").get(id) ?? null;
    return row ? toCategory(row) : null;
  }

  async findAll(): Promise<Category[]> {
    return this.db.query<CategoryRow, []>("SELECT * FROM categories").all().map(toCategory);
  }

  async findAutoCluster(): Promise<Category[]> {
    return this.db
      .query<CategoryRow, []>("SELECT * FROM categories WHERE is_auto_cluster = 1")
      .all()
      .map(toCategory);
  }

  async save(category: Category): Promise<void> {
    const centroid = category.centroidVector
      ? new Uint8Array(category.centroidVector.buffer)
      : null;
    this.db.run(
      `INSERT INTO categories
         (id, name, description, is_auto_cluster, centroid_vector, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, description = excluded.description,
         is_auto_cluster = excluded.is_auto_cluster, centroid_vector = excluded.centroid_vector,
         color = excluded.color, updated_at = excluded.updated_at`,
      [
        category.id,
        category.name,
        category.description,
        category.isAutoCluster ? 1 : 0,
        centroid,
        category.color,
        category.createdAt.getTime(),
        category.updatedAt.getTime(),
      ],
    );
  }

  async update(
    id: CategoryId,
    patch: Partial<Pick<Category, "name" | "description" | "color" | "centroidVector">>,
  ): Promise<void> {
    const centroid =
      patch.centroidVector !== undefined
        ? patch.centroidVector !== null
          ? new Uint8Array(patch.centroidVector.buffer)
          : null
        : undefined;
    patchRow(this.db, "categories", id, {
      name: patch.name,
      description: patch.description,
      color: patch.color,
      centroid_vector: centroid,
    });
  }

  async delete(id: CategoryId): Promise<void> {
    this.db.run("DELETE FROM categories WHERE id = ?", [id]);
  }
}
