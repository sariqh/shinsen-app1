"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assets = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const zod_1 = require("zod");
const assets_1 = require("./schemas/assets");
const _util_1 = require("./_util");
const pathSchema = zod_1.z.object({ userId: zod_1.z.string().min(1) });
exports.assets = (0, https_1.onRequest)(async (req, res) => {
    try {
        const m = req.path.match(/\/users\/([^/]+)\/assets\/?$/);
        if (!m) {
            res.status(400).json({ error: { code: 400, message: "Bad path. expected /users/{userId}/assets" } });
            return;
        }
        const { userId } = pathSchema.parse({ userId: decodeURIComponent(m[1]) });
        const ref = _admin_1.db.collection("users").doc(userId).collection("assets").doc("current");
        if (req.method === "GET") {
            const snap = await ref.get();
            if (!snap.exists) {
                res.json({});
                return;
            }
            const d = snap.data();
            res.json({ ...d, createdAt: (0, _util_1.toISO)(d.createdAt), updatedAt: (0, _util_1.toISO)(d.updatedAt) });
            return;
        }
        if (req.method === "POST") {
            const body = assets_1.AssetSchema.parse(req.body ?? {});
            const current = await ref.get();
            const data = {
                ...body,
                createdAt: current.exists ? current.get("createdAt") : _admin_1.F.serverTimestamp(),
                updatedAt: _admin_1.F.serverTimestamp(),
            };
            await ref.set(data, { merge: false });
            const saved = await ref.get();
            const d = saved.data();
            res.json({ ...d, createdAt: (0, _util_1.toISO)(d.createdAt), updatedAt: (0, _util_1.toISO)(d.updatedAt) });
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
