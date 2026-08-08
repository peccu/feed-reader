export type RelevanceLabel = "high" | "medium" | "low";

export interface RelevanceScore {
  readonly value: number;
  readonly label: RelevanceLabel;
}

export function createRelevanceScore(value: number): RelevanceScore {
  if (value < 0 || value > 1) throw new Error(`Score must be 0..1, got ${value}`);
  const label: RelevanceLabel = value >= 0.7 ? "high" : value >= 0.4 ? "medium" : "low";
  return { value, label };
}
