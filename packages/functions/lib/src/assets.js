"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assets = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const _util_1 = require("./_util");
const assets_1 = require("@schemas/assets"); // ← ここ
const ASSET_ID = "current";
exports.assets = (0, https_1.onRequest)(async (req, res) => {
    try {
        // /users/:uid/assets
        const seg = (req.path || "").split("/").filter(Boolean);
        const uidIndex = seg.indexOf("users") + 1;
        const assetsIndex = seg.indexOf("assets");
        const userId = seg[uidIndex];
        if (!userId || assetsIndex < 0) {
            res.status(404).json({ error: { code: 404, message: "Not Found" } });
            return;
        }
        const ref = _admin_1.db.collection("users").doc(userId).collection("assets").doc(ASSET_ID);
        if (req.method === "GET") {
            const doc = await ref.get();
            if (!doc.exists) {
                res.json(null);
                return;
            }
            res.json((0, _util_1.docToJson)(doc.data()));
            return;
        }
        if (req.method === "POST") {
            const parsed = assets_1.AssetSchema.parse(req.body);
            if (parsed.assetId && parsed.assetId !== ASSET_ID) {
                // 念のため assetId 入ってきたら上書き
                parsed.assetId = ASSET_ID;
            }
            const key = `assets:${userId}:${JSON.stringify(parsed).length}`;
            if ((0, _util_1.seen)(key)) {
                res.status(200).json({ deduped: true });
                return;
            }
            const current = await ref.get();
            const data = {
                ...parsed,
                assetId: ASSET_ID,
                createdAt: current.exists ? current.get("createdAt") : _admin_1.admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: _admin_1.admin.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(data, { merge: false });
            const saved = await ref.get();
            res.json((0, _util_1.docToJson)(saved.data()));
            return;
        }
        res.status(405).json({ error: { code: 405, message: "Method Not Allowed" } });
    }
    catch (e) {
        res.status(500).json({ error: { code: 500, message: String(e?.message || e) } });
    }
});
