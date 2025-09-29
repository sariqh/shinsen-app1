"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositionSchema = exports.CompositionSlotSchema = exports.UnitType = exports.Camp = void 0;
const zod_1 = require("zod");
exports.Camp = zod_1.z.coerce.number().int().min(1).max(4);
exports.UnitType = zod_1.z.coerce.number().int().min(1).max(5);
exports.CompositionSlotSchema = zod_1.z.object({
    warlordId: zod_1.z.string(),
    camp: exports.Camp,
    skillIds: zod_1.z.array(zod_1.z.string()).max(2).default([]),
    tacticIds: zod_1.z.array(zod_1.z.string()).max(3).default([]),
    notes: zod_1.z.object({
        attr: zod_1.z.string().max(2000).optional().default(""),
        equipSkill: zod_1.z.string().max(2000).optional().default(""),
        memo: zod_1.z.string().max(2000).optional().default(""),
    }).default({ attr: "", equipSkill: "", memo: "" }),
});
exports.CompositionSchema = zod_1.z.object({
    compositionId: zod_1.z.string().optional(),
    userId: zod_1.z.string(),
    name: zod_1.z.string().default(""),
    unitType: exports.UnitType,
    slots: zod_1.z.array(exports.CompositionSlotSchema).max(3).default([]),
    warlordIdsFlat: zod_1.z.array(zod_1.z.string()).optional(),
    skillIdsFlat: zod_1.z.array(zod_1.z.string()).optional(),
    expectedUpdatedAt: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
