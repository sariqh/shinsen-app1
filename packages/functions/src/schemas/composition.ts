import { z } from "zod";

export const Camp = z.coerce.number().int().min(1).max(4);
export const UnitType = z.coerce.number().int().min(1).max(5);

export const CompositionSlotSchema = z.object({
  warlordId: z.string(),
  camp: Camp,
  skillIds: z.array(z.string()).max(2).default([]),
  tacticIds: z.array(z.string()).max(3).default([]),
  notes: z.object({
    attr: z.string().max(2000).optional().default(""),
    equipSkill: z.string().max(2000).optional().default(""),
    memo: z.string().max(2000).optional().default(""),
  }).default({ attr: "", equipSkill: "", memo: "" }),
});

export const CompositionSchema = z.object({
  compositionId: z.string().optional(),
  userId: z.string(),
  name: z.string().default(""),
  unitType: UnitType,
  slots: z.array(CompositionSlotSchema).max(3).default([]),
  warlordIdsFlat: z.array(z.string()).optional(),
  skillIdsFlat: z.array(z.string()).optional(),
  expectedUpdatedAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Composition = z.infer<typeof CompositionSchema>;
