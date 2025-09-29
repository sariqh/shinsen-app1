import { z } from "zod";

// 列挙（数値で管理）
export const Camp = z.coerce.number().int().min(1).max(4);       // 1=魏 2=呉 3=蜀 4=群
export const UnitType = z.coerce.number().int().min(1).max(5);   // 1..5

// スロット 1 人分
export const CompositionSlotSchema = z.object({
  warlordId: z.string(),
  camp: Camp,
  skillIds: z.array(z.string()).max(2).default([]),
  tacticIds: z.array(z.string()).max(3).default([]),
  notes: z
    .object({
      attr: z.string().max(2000).optional().default(""),
      equipSkill: z.string().max(2000).optional().default(""),
      memo: z.string().max(2000).optional().default(""),
    })
    .default({ attr: "", equipSkill: "", memo: "" }),
});

// 本体
export const CompositionSchema = z.object({
  compositionId: z.string().optional(), // POST では未指定、サーバで付与
  userId: z.string(),
  name: z.string().default(""),
  unitType: UnitType,
  slots: z.array(CompositionSlotSchema).max(3).default([]),
  warlordIdsFlat: z.array(z.string()).optional(),
  skillIdsFlat: z.array(z.string()).optional(),

  // 楽観ロック用（PUT時のみクライアントが付与）
  expectedUpdatedAt: z.string().optional(),

  // サーバ整形で入る ISO
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Composition = z.infer<typeof CompositionSchema>;