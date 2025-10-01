import { z } from "zod";

// 参照: 06/3.3 数値Enum（1=作戦 2=虚実 3=軍形 4=九変 5=始計 6=用間）
export const TacticCategory = z.number().int().min(1).max(6);
export type TacticCategory = z.infer<typeof TacticCategory>;

// 参照: 06/3.1.3 Master tactic
export const TacticSchema = z.object({
  id: z.string(), // repository層で tacticId -> id にマッピング
  name: z.string(),
  category: TacticCategory,
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Tactic = z.infer<typeof TacticSchema>;

