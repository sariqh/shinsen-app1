import { CompositionSchema, type Composition } from "@/src/schema/composition";

const EMPTY_SLOT = {
  warlordId: null,
  camp: null,
  skillIds: ["", ""],
  tacticIds: ["", "", ""],
  notes: { attr: "", equipSkill: "", memo: "" },
};

// 参照: 07/4 Compositions CRUD, expectedUpdatedAt 必須（PUT）
export async function getComposition(userId: string, compositionId: string): Promise<Composition> {
  // TODO: /api/v1/users/{userId}/compositions/{compositionId}
  return CompositionSchema.parse({
    compositionId,
    userId,
    name: "",
    unitType: 1,
    slots: [EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT],
    warlordIdsFlat: ["", "", ""],
    skillIdsFlat: [],
  });
}

export async function createComposition(userId: string, name = ""): Promise<Composition> {
  const compositionId = `cmp_${Date.now()}`;
  return CompositionSchema.parse({
    compositionId,
    userId,
    name,
    unitType: 1,
    slots: [EMPTY_SLOT, EMPTY_SLOT, EMPTY_SLOT],
    warlordIdsFlat: ["", "", ""],
    skillIdsFlat: [],
  });
}

export async function updateComposition(userId: string, compositionId: string, payload: Composition & { expectedUpdatedAt: string }): Promise<Composition> {
  // TODO: 409 on mismatch（参照: 07/3 同時更新制御）
  return CompositionSchema.parse(payload);
}

export async function deleteComposition(userId: string, compositionId: string): Promise<{ ok: true }>{
  // TODO: 実API接続
  return { ok: true };
}

