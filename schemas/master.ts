import { z } from "zod";

export const WarlordSchema = z.object({
  warlordId: z.string(),
  numericId: z.coerce.number().int().optional(),
  name: z.string(),
  rarity: z.coerce.number().int().min(1).max(3),   // 1=星5 2=星4 3=星3
  camp: z.coerce.number().int().min(1).max(4),
  cost: z.coerce.number().int(),
  uniqueSkillId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const SkillSchema = z.object({
  skillId: z.string(),
  numericId: z.coerce.number().int().optional(),
  name: z.string(),
  rarity: z.coerce.number().int().min(1).max(3),   // 1=S 2=A 3=B
  type: z.coerce.number().int().min(1).max(6),     // 1=指揮..6=陣法
  displayGroup: z.coerce.number().int().min(1).max(8),
  inheritedSkill: z.boolean(),
  useLimit: z.coerce.number().int().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const TacticSchema = z.object({
  tacticId: z.string(),
  name: z.string(),
  category: z.coerce.number().int().min(1).max(6),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Warlord = z.infer<typeof WarlordSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Tactic = z.infer<typeof TacticSchema>;