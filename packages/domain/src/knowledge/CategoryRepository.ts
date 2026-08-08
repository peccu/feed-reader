import type { CategoryId } from "../shared.ts";
import type { Category } from "./Category.ts";

export interface CategoryRepository {
  findById(id: CategoryId): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findAutoCluster(): Promise<Category[]>;
  save(category: Category): Promise<void>;
  update(
    id: CategoryId,
    patch: Partial<Pick<Category, "name" | "description" | "color" | "centroidVector">>,
  ): Promise<void>;
  delete(id: CategoryId): Promise<void>;
}
