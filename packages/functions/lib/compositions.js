"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compositions = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const zod_1 = require("zod");
const composition_1 = require("./schemas/composition");
const _util_1 = require("./_util");
const pathList = zod_1.z.object({ userId: zod_1.z.string().min(1) });
const pathDetail = zod_1.z.object({ userId: zod_1.z.string().min(1), compositionId: zod_1.z.string().min(1) });
exports.compositions = (0, https_1.onRequest)(async (req, res) => {
    try {
        const mList = req.path.match(/\/users\/([^/]+)\/compositions\/?$/);
        const mDetail = req.path.match(/\/users\/([^/]+)\/compositions\/([^/]+)\/?$/);
        if (req.method === "GET" && mDetail) {
            const { userId, compositionId } = pathDetail.parse({ userId: decodeURIComponent(mDetail[1]), compositionId: decodeURIComponent(mDetail[2]) });
            const ref = _admin_1.db.collection("users").doc(userId).collection("compositions").doc(compositionId);
            const snap = await ref.get();
            if (!snap.exists) {
                res.status(404).json({ error: { code: 404, message: "Not Found" } });
                return;
            }
            const d = snap.data();
            res.json({ ...d, createdAt: (0, _util_1.toISO)(d.createdAt), updatedAt: (0, _util_1.toISO)(d.updatedAt) });
            return;
        }
        if (req.method === "POST" && mList) {
            const { userId } = pathList.parse({ userId: decodeURIComponent(mList[1]) });
            const parsed = composition_1.CompositionSchema.omit({ compositionId: true, expectedUpdatedAt: true, createdAt: true, updatedAt: true }).parse(req.body ?? {});
            const col = _admin_1.db.collection("users").doc(userId).collection("compositions");
            const ref = col.doc();
            const flat = {
                warlordIdsFlat: (parsed.slots ?? []).map(s => s.warlordId).slice(0, 3),
                skillIdsFlat: (parsed.slots ?? []).flatMap(s => s.skillIds).slice(0, 6),
            };
            const data = { ...parsed, compositionId: ref.id, ...flat, createdAt: _admin_1.F.serverTimestamp(), updatedAt: _admin_1.F.serverTimestamp() };
            await ref.set(data, { merge: false });
            const d = (await ref.get()).data();
            res.json({ ...d, createdAt: (0, _util_1.toISO)(d.createdAt), updatedAt: (0, _util_1.toISO)(d.updatedAt) });
            return;
        }
        if (req.method === "PUT" && mDetail) {
            const { userId, compositionId } = pathDetail.parse({ userId: decodeURIComponent(mDetail[1]), compositionId: decodeURIComponent(mDetail[2]) });
            const parsed = composition_1.CompositionSchema.parse({ ...(req.body ?? {}), compositionId });
            const ref = _admin_1.db.collection("users").doc(userId).collection("compositions").doc(compositionId);
            const cur = await ref.get();
            if (!cur.exists) {
                res.status(404).json({ error: { code: 404, message: "Not Found" } });
                return;
            }
            const expected = parsed.expectedUpdatedAt;
            const currentIso = (0, _util_1.toISO)(cur.get("updatedAt"));
            if (expected && currentIso && expected !== currentIso) {
                res.status(409).json({ error: { code: 409, message: "Conflict: newer version exists", current: { updatedAt: currentIso } } });
                return;
            }
            const flat = {
                warlordIdsFlat: (parsed.slots ?? []).map(s => s.warlordId).slice(0, 3),
                skillIdsFlat: (parsed.slots ?? []).flatMap(s => s.skillIds).slice(0, 6),
            };
            const data = { ...parsed, ...flat, updatedAt: _admin_1.F.serverTimestamp() };
            delete data.expectedUpdatedAt;
            await ref.set(data, { merge: true });
            const d = (await ref.get()).data();
            res.json({ ...d, createdAt: (0, _util_1.toISO)(d.createdAt), updatedAt: (0, _util_1.toISO)(d.updatedAt) });
            return;
        }
        if (req.method === "DELETE" && mDetail) {
            const { userId, compositionId } = pathDetail.parse({ userId: decodeURIComponent(mDetail[1]), compositionId: decodeURIComponent(mDetail[2]) });
            await _admin_1.db.collection("users").doc(userId).collection("compositions").doc(compositionId).delete();
            res.status(204).end();
            return;
        }
        res.status(405).json({ error: { code: 405, message: "Method Not Allowed" } });
        return;
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: { code: 500, message: e?.message || String(e) } });
        return;
    }
});
