import { z } from "zod";

// 参照: 06/3.3 数値Enum（1=S 2=A 3=B）
export const SkillRarity = z.number().int().min(1).max(3);
export type SkillRarity = z.infer<typeof SkillRarity>;

// 参照: 06/3.3 数値Enum（1=指揮 2=アクティブ 3=突撃 4=パッシブ 5=兵種 6=陣法）
export const SkillType = z.number().int().min(1).max(6);
export type SkillType = z.infer<typeof SkillType>;

// 参照: 06/3.1.2, 03/1.2 表示グルーピング
// enum (1=指揮 2=アクティブPK 3=アクティブS 4=アクティブA 5=突撃 6=パッシブ 7=兵種 8=陣法)
// 注: アクティブPK/S/Aの分割は表示上のグルーピングであり、辞書の戦法種別（type）は不変（参照: 03/3.1）
export const SkillDisplayGroup = z.number().int().min(1).max(8);
export type SkillDisplayGroup = z.infer<typeof SkillDisplayGroup>;

// 参照: 06/3.1.2 Master skill
export const SkillSchema = z.object({
  id: z.string(), // repository層で skillId -> id にマッピング
  numericId: z.number().int(),
  name: z.string(),
  rarity: SkillRarity,
  type: SkillType,
  displayGroup: SkillDisplayGroup,
  inheritedSkill: z.boolean(),
  useLimit: z.number().int().nonnegative(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

