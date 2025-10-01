import { z } from "zod";
import { WarlordSchema } from "@/src/schema/warlord";
import { SkillSchema } from "@/src/schema/skill";
import { TacticSchema } from "@/src/schema/tactic";

import warlordsJson from "@/data/master/warlords.json";
import skillsJson from "@/data/master/skills.json";
import tacticsJson from "@/data/master/tactics.json";

// 参照: 07/3 master系 GET は public cache + SWR 推奨
// NOTE: MVP は静的JSONを返却。将来は /api/v1/master/* に差替（参照: 07/2）

const WarlordListSchema = z.array(WarlordSchema);
const SkillListSchema = z.array(SkillSchema);
const TacticListSchema = z.array(TacticSchema);

export type WarlordList = z.infer<typeof WarlordListSchema>;
export type SkillList = z.infer<typeof SkillListSchema>;
export type TacticList = z.infer<typeof TacticListSchema>;

// 参照: memory:9475155 - warlordId->id マッピング
export async function getWarlords(): Promise<WarlordList> {
  const raw = warlordsJson as Array<{
    warlordId: string;
    numericId: number;
    name: string;
    rarity: number;
    camp: number;
    cost: number | null;
    uniqueSkillId: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  
  // warlordId -> id にマッピング
  // 注: JSONの "timestamp" 文字列は除外（Zodの.datetime()でエラーになるため）
  const mapped = raw.map((w) => ({
    id: w.warlordId,
    numericId: w.numericId,
    name: w.name,
    rarity: w.rarity,
    camp: w.camp,
    cost: w.cost,
    uniqueSkillId: w.uniqueSkillId,
    createdAt: w.createdAt === "timestamp" ? undefined : w.createdAt,
    updatedAt: w.updatedAt === "timestamp" ? undefined : w.updatedAt,
  }));
  
  return WarlordListSchema.parse(mapped);
}

export async function getSkills(): Promise<SkillList> {
  const raw = skillsJson as Array<{
    skillId: string;
    numericId: number;
    name: string;
    rarity: number;
    type: number;
    displayGroup: number;
    inheritedSkill: boolean;
    useLimit: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  
  // skillId -> id にマッピング
  // 注: JSONの "timestamp" 文字列は除外
  const mapped = raw.map((s) => ({
    id: s.skillId,
    numericId: s.numericId,
    name: s.name,
    rarity: s.rarity,
    type: s.type,
    displayGroup: s.displayGroup,
    inheritedSkill: s.inheritedSkill,
    useLimit: s.useLimit,
    createdAt: s.createdAt === "timestamp" ? undefined : s.createdAt,
    updatedAt: s.updatedAt === "timestamp" ? undefined : s.updatedAt,
  }));
  
  return SkillListSchema.parse(mapped);
}

export async function getTactics(): Promise<TacticList> {
  const raw = tacticsJson as Array<{
    tacticId: string;
    name: string;
    category: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  
  // tacticId -> id にマッピング
  // 注: JSONの "timestamp" 文字列は除外
  const mapped = raw.map((t) => ({
    id: t.tacticId,
    name: t.name,
    category: t.category,
    createdAt: t.createdAt === "timestamp" ? undefined : t.createdAt,
    updatedAt: t.updatedAt === "timestamp" ? undefined : t.updatedAt,
  }));
  
  return TacticListSchema.parse(mapped);
}

