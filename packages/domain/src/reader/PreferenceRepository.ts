import type { PreferenceProfileId } from "../shared.ts";
import type { PreferenceProfile } from "./PreferenceProfile.ts";

export interface PreferenceRepository {
  findById(id: PreferenceProfileId): Promise<PreferenceProfile | null>;
  findByName(name: string): Promise<PreferenceProfile | null>;
  findDefault(): Promise<PreferenceProfile | null>;
  save(profile: PreferenceProfile): Promise<void>;
}
