"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seen = exports.docToJson = exports.toISO = void 0;
// Timestamp → ISO
const toISO = (ts) => {
    if (!ts)
        return null;
    return ts.toDate().toISOString();
};
exports.toISO = toISO;
// Firestore ドキュメント to JSON（createdAt/updatedAt を ISO 化）
const docToJson = (data) => {
    const { createdAt, updatedAt, ...rest } = data;
    return { ...rest, createdAt: (0, exports.toISO)(createdAt), updatedAt: (0, exports.toISO)(updatedAt) };
};
exports.docToJson = docToJson;
// メモリ簡易デデュープ（時間窓）
const seenSet = new Map();
const TTL_MS = 60000; // 60s
const seen = (key) => {
    const now = Date.now();
    // GC
    for (const [k, t] of seenSet)
        if (now - t > TTL_MS)
            seenSet.delete(k);
    const hit = seenSet.has(key);
    seenSet.set(key, now);
    return hit;
};
exports.seen = seen;
