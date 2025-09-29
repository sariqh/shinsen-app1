"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspace = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const _util_1 = require("./_util");
const workspace_1 = require("@schemas/workspace"); // ← ここ
const WORKSPACE_ID = "current";
exports.workspace = (0, https_1.onRequest)(async (req, res) => {
    try {
        // /users/:uid/workspace
        const seg = (req.path || "").split("/").filter(Boolean);
        const uidIndex = seg.indexOf("users") + 1;
        const wIndex = seg.indexOf("workspace");
        const userId = seg[uidIndex];
        if (!userId || wIndex < 0) {
            res.status(404).json({ error: { code: 404, message: "Not Found" } });
            return;
        }
        const ref = _admin_1.db.collection("users").doc(userId).collection("workspace").doc(WORKSPACE_ID);
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
            const parsed = workspace_1.WorkspaceSchema.parse(req.body);
            if (parsed.workspaceId && parsed.workspaceId !== WORKSPACE_ID) {
                parsed.workspaceId = WORKSPACE_ID;
            }
            const key = `workspace:${userId}:${JSON.stringify(parsed).length}`;
            if ((0, _util_1.seen)(key)) {
                res.status(200).json({ deduped: true });
                return;
            }
            const cur = await ref.get();
            const data = {
                ...parsed,
                workspaceId: WORKSPACE_ID,
                createdAt: cur.exists ? cur.get("createdAt") : _admin_1.admin.firestore.FieldValue.serverTimestamp(),
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
