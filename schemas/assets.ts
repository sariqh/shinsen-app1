import { z } from "zod";

// レコード: { id:string -> copies:number(>=0) }
export const OwnedWarlordsSchema = z.record(z.string(), z.number().int().min(0));
// レコード: { id:string -> owned:boolean }
export const OwnedSkillsSchema = z.record(z.string(), z.boolean());

export const AssetSchema = z.object({
  assetId: z.string().default("current"),
  ownedWarlords: OwnedWarlordsSchema.default({}),
  ownedSkills:   OwnedSkillsSchema.default({}),
  // Functions が返却時に ISO へ整形するため optional
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;