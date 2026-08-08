import type { CategoryId } from "../shared.ts";

export interface Category {
  readonly id: CategoryId;
  readonly name: string;
  readonly description: string | null;
  readonly isAutoCluster: boolean;
  readonly centroidVector: Float32Array | null;
  readonly color: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateCategoryInput {
  id: CategoryId;
  name: string;
  description?: string;
  isAutoCluster?: boolean;
  centroidVector?: Float32Array;
  color?: string;
}

export function createCategory(input: CreateCategoryInput): Category {
  if (!input.name.trim()) throw new Error("Category name cannot be empty");
  const now = new Date();
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? null,
    isAutoCluster: input.isAutoCluster ?? false,
    centroidVector: input.centroidVector ?? null,
    color: input.color ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
