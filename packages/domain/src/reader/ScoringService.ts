import type { Embedding } from "../content/Embedding.ts";
import type { PreferenceProfile } from "./PreferenceProfile.ts";
import type { RelevanceScore } from "./RelevanceScore.ts";

export interface ScoringService {
  score(embedding: Embedding, profile: PreferenceProfile): RelevanceScore;
}
