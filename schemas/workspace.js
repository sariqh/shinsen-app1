"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSchema = void 0;
const zod_1 = require("zod");
exports.WorkspaceSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().default("current"),
    freeAreaCompositionIds: zod_1.z.array(zod_1.z.string()).max(10).default([]),
    constraintAreaCompositionIds: zod_1.z.array(zod_1.z.string()).max(5).default([]),
    createdAt: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().optional(),
});
