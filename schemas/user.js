"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const zod_1 = require("zod");
exports.User = zod_1.z.object({
    userId: zod_1.z.string(),
    displayName: zod_1.z.string(),
    email: zod_1.z.string().email().nullable().optional(),
    createdAt: zod_1.z.string().optional(), // ISO
    updatedAt: zod_1.z.string().optional(), // ISO
});
