"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetSchema = exports.OwnedSkillsSchema = exports.OwnedWarlordsSchema = void 0;
const zod_1 = require("zod");
exports.OwnedWarlordsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.number().int().min(0));
exports.OwnedSkillsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.boolean());
exports.AssetSchema = zod_1.z.object({
    assetId: zod_1.z.string().default("current"),
    ownedWarlords: exports.OwnedWarlordsSchema.default({}),
    ownedSkills: exports.OwnedSkillsSchema.default({}),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
