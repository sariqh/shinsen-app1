import { z } from "zod";
import { CompositionSchema, type Composition } from "@/src/schema/composition";

// 参照: 07/4 Compositions CRUD, expectedUpdatedAt 必須（PUT）
export async function getComposition(userId: string, compositionId: string): Promise<Composition> {
  // TODO: /api/v1/users/{userId}/compositions/{compositionId}
  return CompositionSchema.parse({
    compositionId,
    unitType: 0,
    slots: [
      { warlordId: null, camp: null, skillIds: ["",""], tacticIds: ["","",""], notes: { attr:"", equipSkill:"", memo:"" } },
      { warlordId: null, camp: null, skillIds: ["",""], tacticIds: ["","",""], notes: { attr:"", equipSkill:"", memo:"" } },
      { warlordId: null, camp: null, skillIds: ["",""], tacticIds: ["","",""], notes: { attr:"", equipSkill:"", memo:"" } }
    ],
    warlordIdsFlat: ["","",""],
  });
}

export async function createComposition(userId: string): Promise<Composition> {
  return getComposition(userId, `cmp_${Date.now()}`);
}

export async function updateComposition(userId: string, compositionId: string, payload: Composition & { expectedUpdatedAt: string }): Promise<Composition> {
  // TODO: 409 on mismatch（参照: 07/3 同時更新制御）
  return CompositionSchema.parse(payload);
}

export async function deleteComposition(userId: string, compositionId: string): Promise<{ ok: true }>{
  // TODO: 実API接続
  return { ok: true };
}

