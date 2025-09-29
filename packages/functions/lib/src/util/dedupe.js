"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeKey = makeKey;
exports.seen = seen;
const windowMs = 120000; // 120s time window
const mem = new Map();
function makeKey(userId, resource, id, updatedAt) {
    return [userId, resource, id || "", updatedAt || ""].join("|");
}
function seen(key) {
    const now = Date.now();
    const ts = mem.get(key);
    if (ts && now - ts < windowMs)
        return true;
    mem.set(key, now);
    // cleanup occasionally
    if (mem.size > 1000) {
        const cutoff = now - windowMs;
        for (const [k, t] of mem.entries())
            if (t < cutoff)
                mem.delete(k);
    }
    return false;
}
