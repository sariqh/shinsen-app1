import { z } from "zod";

export const OwnedWarlordsSchema = z.record(z.string(), z.number().int().min(0));
export const OwnedSkillsSchema = z.record(z.string(), z.boolean());

export const AssetSchema = z.object({
  assetId: z.string().default("current"),
  ownedWarlords: OwnedWarlordsSchema.default({}),
  ownedSkills:   OwnedSkillsSchema.default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;
