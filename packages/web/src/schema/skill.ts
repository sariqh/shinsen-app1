import { z } from "zod";

// 参照: 06/3.2 Master skill（指揮/アクティブ/突撃/パッシブ/兵種/陣法）
export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.number(), // PK/S/A の表示グルーピングはUI側（参照: 03/3.1）
  updatedAt: z.string().datetime().optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

