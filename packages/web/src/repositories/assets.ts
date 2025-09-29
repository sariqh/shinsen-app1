import { z } from "zod";
import { AssetsSchema, type Assets } from "@/src/schema/assets";

// 参照: 07/2, 07/4 Assets API I/O 型
const AssetsResponseSchema = AssetsSchema.extend({
  updatedAt: z.string().datetime().optional()
});

export async function getAssets(userId: string): Promise<Assets> {
  // TODO: /api/v1/users/{userId}/assets（参照: 07/2）
  return AssetsResponseSchema.parse({ ownedWarlords: {}, ownedSkills: {} });
}

export async function upsertAssets(userId: string, payload: Assets): Promise<Assets> {
  // TODO: OCR確定/ナビゲーション境界でアップサート（参照: 04/4.2, 06/2.3）
  return AssetsResponseSchema.parse(payload);
}

