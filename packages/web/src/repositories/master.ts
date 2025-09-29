import { z } from "zod";
import { WarlordSchema } from "@/src/schema/warlord";
import { SkillSchema } from "@/src/schema/skill";
import { TacticSchema } from "@/src/schema/tactic";

// 参照: 07/3 master系 GET は public cache + SWR 推奨
// TODO: SWR のキー設計と Dexie masterCache 連携（参照: CURSOR_CONTEXT 5, 6, 7）

const WarlordListSchema = z.array(WarlordSchema);
const SkillListSchema = z.array(SkillSchema);
const TacticListSchema = z.array(TacticSchema);

export type WarlordList = z.infer<typeof WarlordListSchema>;
export type SkillList = z.infer<typeof SkillListSchema>;
export type TacticList = z.infer<typeof TacticListSchema>;

async function loadLocalJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const mod = await import(path);
  return schema.parse(mod.default ?? mod);
}

export async function getWarlords(): Promise<WarlordList> {
  // NOTE: MVPは静的JSONを返却。将来は /api/v1/master/warlords に差替（参照: 07/2）
  return loadLocalJson("@/data/master/warlords.json", WarlordListSchema);
}

export async function getSkills(): Promise<SkillList> {
  return loadLocalJson("@/data/master/skills.json", SkillListSchema);
}

export async function getTactics(): Promise<TacticList> {
  return loadLocalJson("@/data/master/tactics.json", TacticListSchema);
}

