import type { PreferenceProfileId } from "../shared.ts";
import type { Embedding } from "../content/Embedding.ts";
import { normalize } from "../content/Embedding.ts";
import type { FeedbackType, VectorTarget } from "./FeedbackType.ts";

const DIMENSIONS = 1024;
const DEFAULT_LEARNING_RATE = 0.05;

export interface PreferenceVectors {
  readonly preference: Float32Array;
  readonly shareable: Float32Array;
  readonly knowledge: Float32Array;
}

export interface PreferenceProfile {
  readonly id: PreferenceProfileId;
  readonly name: string;
  readonly vectors: PreferenceVectors;
  readonly learningRate: number;
  readonly articleCount: number;
  readonly updatedAt: Date;
}

export function createPreferenceProfile(id: PreferenceProfileId, name: string): PreferenceProfile {
  const zero = () => new Float32Array(DIMENSIONS);
  return {
    id,
    name,
    vectors: { preference: zero(), shareable: zero(), knowledge: zero() },
    learningRate: DEFAULT_LEARNING_RATE,
    articleCount: 0,
    updatedAt: new Date(),
  };
}

export function applyFeedback(
  profile: PreferenceProfile,
  embedding: Embedding,
  feedbackType: FeedbackType,
  target: VectorTarget,
): PreferenceProfile {
  const decay = 1 - profile.learningRate;
  const current = profile.vectors[target];
  const vec = embedding.vector;
  const updated = new Float32Array(DIMENSIONS);
  if (feedbackType === "like") {
    for (let i = 0; i < DIMENSIONS; i++) {
      updated[i] = (current[i] ?? 0) * decay + (vec[i] ?? 0) * profile.learningRate;
    }
  } else {
    for (let i = 0; i < DIMENSIONS; i++) {
      updated[i] = (current[i] ?? 0) * decay - (vec[i] ?? 0) * profile.learningRate;
    }
  }
  return {
    ...profile,
    vectors: { ...profile.vectors, [target]: normalize(updated) },
    articleCount: profile.articleCount + 1,
    updatedAt: new Date(),
  };
}
