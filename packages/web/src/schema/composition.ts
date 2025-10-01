import { z } from "zod";

// 参照: 06/3.2.3 composition.slots[*] は 3枠固定のモデル
// MVPでは空スロット表現のため warlordId/camp を null 許容
export const Camp = z.number().int().min(1).max(4).nullable();
export const UnitType = z.number().int().min(1).max(5);

export const CompositionSlotSchema = z.object({
  warlordId: z.string().nullable(),
  camp: Camp,
  skillIds: z.array(z.string()).length(2).default(["",""]),
  tacticIds: z.array(z.string()).length(3).default(["","",""]),
  notes: z
    .object({
      attr: z.string().max(2000).optional().default(""),
      equipSkill: z.string().max(2000).optional().default(""),
      memo: z.string().max(2000).optional().default(""),
    })
    .default({ attr: "", equipSkill: "", memo: "" }),
});

export const CompositionSchema = z.object({
  compositionId: z.string(),
  userId: z.string(),
  name: z.string().default(""), // 編成名（任意）
  unitType: UnitType,
  slots: z.array(CompositionSlotSchema).length(3),
  warlordIdsFlat: z.array(z.string()).length(3), // 検索用（参照: 06/2.6）
  skillIdsFlat: z.array(z.string()).default([]), // 検索用（参照: 06/3.2.3）
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Composition = z.infer<typeof CompositionSchema>;


