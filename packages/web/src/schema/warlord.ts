import { z } from "zod";

// 参照: 06/3.3 数値Enum
export const CampEnum = z.nativeEnum({} as unknown as Record<string, number>);
export type Camp = z.infer<typeof CampEnum>;

// 参照: 06/3.2 Master warlord
export const WarlordSchema = z.object({
  id: z.string(),
  name: z.string(),
  camp: z.number(), // TODO: Camp へ（参照: 06/3.3）
  unitType: z.number(),
  rarity: z.number().optional(),
  updatedAt: z.string().datetime().optional(), // APIはISO-8601（参照: 07/2）
});
export type Warlord = z.infer<typeof WarlordSchema>;

