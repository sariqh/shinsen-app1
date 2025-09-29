"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TacticSchema = exports.SkillSchema = exports.WarlordSchema = void 0;
const zod_1 = require("zod");
exports.WarlordSchema = zod_1.z.object({
    warlordId: zod_1.z.string(),
    numericId: zod_1.z.coerce.number().int().optional(),
    name: zod_1.z.string(),
    rarity: zod_1.z.coerce.number().int().min(1).max(3), // 1=星5 2=星4 3=星3
    camp: zod_1.z.coerce.number().int().min(1).max(4),
    cost: zod_1.z.coerce.number().int(),
    uniqueSkillId: zod_1.z.string(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.SkillSchema = zod_1.z.object({
    skillId: zod_1.z.string(),
    numericId: zod_1.z.coerce.number().int().optional(),
    name: zod_1.z.string(),
    rarity: zod_1.z.coerce.number().int().min(1).max(3), // 1=S 2=A 3=B
    type: zod_1.z.coerce.number().int().min(1).max(6), // 1=指揮..6=陣法
    displayGroup: zod_1.z.coerce.number().int().min(1).max(8),
    inheritedSkill: zod_1.z.boolean(),
    useLimit: zod_1.z.coerce.number().int().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
exports.TacticSchema = zod_1.z.object({
    tacticId: zod_1.z.string(),
    name: zod_1.z.string(),
    category: zod_1.z.coerce.number().int().min(1).max(6),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
