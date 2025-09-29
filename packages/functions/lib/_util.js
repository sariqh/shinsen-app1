"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toISO = void 0;
const toISO = (v) => v?.toDate?.()?.toISOString?.() ?? undefined;
exports.toISO = toISO;
