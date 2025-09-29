import { z } from "zod";

// 参照: 06/2.3 users/{userId}/assets/current
export const AssetsSchema = z.object({
  ownedWarlords: z.record(z.string(), z.number().int().nonnegative()).default({}),
  ownedSkills: z.record(z.string(), z.boolean()).default({}),
  updatedAt: z.string().datetime().optional(),
});

export type Assets = z.infer<typeof AssetsSchema>;

