import type { Database } from "bun:sqlite";
import type {
  PreferenceProfile,
  PreferenceProfileId,
  PreferenceRepository,
  PreferenceVectors,
} from "@feed-reader/domain";
import { PreferenceProfileId as mkProfileId } from "@feed-reader/domain";

type ProfileRow = {
  id: string;
  name: string;
  learning_rate: number;
  article_count: number;
  created_at: number;
  updated_at: number;
};

type VectorRow = {
  target: string;
  vector: Uint8Array;
};

const TARGETS = ["preference", "shareable", "knowledge"] as const;
const DIMS = 1024;

function toFloat32(buf: Uint8Array): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function fromFloat32(arr: Float32Array): Uint8Array {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

function toProfile(row: ProfileRow, vecRows: VectorRow[]): PreferenceProfile {
  const byTarget = new Map(vecRows.map((r) => [r.target, toFloat32(r.vector)]));
  const zero = () => new Float32Array(DIMS);
  const vectors: PreferenceVectors = {
    preference: byTarget.get("preference") ?? zero(),
    shareable: byTarget.get("shareable") ?? zero(),
    knowledge: byTarget.get("knowledge") ?? zero(),
  };
  return {
    id: mkProfileId(row.id),
    name: row.name,
    vectors,
    learningRate: row.learning_rate,
    articleCount: row.article_count,
    updatedAt: new Date(row.updated_at),
  };
}

export class PreferenceRepo implements PreferenceRepository {
  constructor(private readonly db: Database) {}

  private loadVectors(profileId: string): VectorRow[] {
    return this.db
      .query<VectorRow, [string]>(
        "SELECT target, vector FROM preference_vectors WHERE profile_id = ?",
      )
      .all(profileId);
  }

  async findById(id: PreferenceProfileId): Promise<PreferenceProfile | null> {
    const row =
      this.db
        .query<ProfileRow, [string]>("SELECT * FROM preference_profiles WHERE id = ?")
        .get(id) ?? null;
    if (!row) return null;
    return toProfile(row, this.loadVectors(id));
  }

  async findByName(name: string): Promise<PreferenceProfile | null> {
    const row =
      this.db
        .query<ProfileRow, [string]>("SELECT * FROM preference_profiles WHERE name = ?")
        .get(name) ?? null;
    if (!row) return null;
    return toProfile(row, this.loadVectors(row.id));
  }

  async findDefault(): Promise<PreferenceProfile | null> {
    const row =
      this.db
        .query<ProfileRow, []>("SELECT * FROM preference_profiles WHERE name = 'default' LIMIT 1")
        .get() ?? null;
    if (!row) return null;
    return toProfile(row, this.loadVectors(row.id));
  }

  async save(profile: PreferenceProfile): Promise<void> {
    const now = profile.updatedAt.getTime();
    this.db.run(
      `INSERT INTO preference_profiles (id, name, learning_rate, article_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, learning_rate = excluded.learning_rate,
         article_count = excluded.article_count, updated_at = excluded.updated_at`,
      [profile.id, profile.name, profile.learningRate, profile.articleCount, now, now],
    );
    for (const target of TARGETS) {
      this.db.run(
        `INSERT INTO preference_vectors (profile_id, target, vector, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(profile_id, target) DO UPDATE SET vector = excluded.vector, updated_at = excluded.updated_at`,
        [profile.id, target, fromFloat32(profile.vectors[target]), now],
      );
    }
  }
}
