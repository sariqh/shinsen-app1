import { z } from "zod";

// 参照: 06/3.3 数値Enum（1=魏 2=呉 3=蜀 4=群）
export const Camp = z.number().int().min(1).max(4);
export type Camp = z.infer<typeof Camp>;

// 参照: 06/3.3 数値Enum（1=星5 2=星4 3=星3）
export const WarlordRarity = z.number().int().min(1).max(3);
export type WarlordRarity = z.infer<typeof WarlordRarity>;

// 参照: 06/3.1.1 Master warlord
// 注: unitType は composition に属する（06/3.2.3）。warlord には存在しない。
export const WarlordSchema = z.object({
  id: z.string(), // repository層で warlordId -> id にマッピング（参照: memory:9475155）
  numericId: z.number().int(),
  name: z.string(),
  rarity: WarlordRarity,
  camp: Camp,
  cost: z.number().int().min(3).max(7).nullable(),
  uniqueSkillId: z.string().nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(), // APIはISO-8601（参照: 07/2）
});
export type Warlord = z.infer<typeof WarlordSchema>;

