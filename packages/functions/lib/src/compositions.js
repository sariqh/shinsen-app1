"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compositions = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const _util_1 = require("./_util");
const composition_1 = require("@schemas/composition"); // ← ここ
const parsePath = (path) => {
    // /users/:uid/compositions(/:id)? という前提で抽出
    const seg = (path || "").split("/").filter(Boolean);
    const uidIdx = seg.indexOf("users") + 1;
    const cmpIdx = seg.indexOf("compositions");
    const userId = seg[uidIdx];
    const id = cmpIdx >= 0 && seg.length > cmpIdx + 1 ? seg[cmpIdx + 1] : undefined;
    return { userId, id };
};
exports.compositions = (0, https_1.onRequest)(async (req, res) => {
    try {
        const { userId, id } = parsePath(req.path);
        if (!userId) {
            res.status(404).json({ error: { code: 404, message: "Not Found" } });
            return;
        }
        const col = _admin_1.db.collection("users").doc(userId).collection("compositions");
        // GET（一覧 or 単体）
        if (req.method === "GET") {
            if (id) {
                const doc = await col.doc(id).get();
                if (!doc.exists) {
                    res.status(404).json({ error: { code: 404, message: "Not Found" } });
                    return;
                }
                res.json((0, _util_1.docToJson)(doc.data()));
                return;
            }
            else {
                const snap = await col.orderBy("updatedAt", "desc").get().catch(async () => await col.get());
                res.json(snap.docs.map(d => (0, _util_1.docToJson)(d.data())));
                return;
            }
        }
        // POST（新規作成）
        if (req.method === "POST") {
            const parsed = composition_1.CompositionSchema.parse(req.body);
            if (parsed.userId !== userId) {
                res.status(403).json({ error: { code: 403, message: "Forbidden" } });
                return;
            }
            const key = `compositions:POST:${userId}:${(parsed.name || "")}:${(parsed.updatedAt || "")}`;
            if ((0, _util_1.seen)(key)) {
                res.status(200).json({ deduped: true });
                return;
            }
            const ref = col.doc(); // サーバ生成ID
            const data = {
                ...parsed,
                compositionId: ref.id,
                createdAt: _admin_1.admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: _admin_1.admin.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(data, { merge: false });
            const saved = await ref.get();
            res.status(201).json((0, _util_1.docToJson)(saved.data()));
            return;
        }
        // PUT（更新）
        if (req.method === "PUT" && id) {
            const parsed = composition_1.CompositionSchema.parse(req.body);
            if (parsed.userId !== userId) {
                res.status(403).json({ error: { code: 403, message: "Forbidden" } });
                return;
            }
            const ref = col.doc(id);
            const cur = await ref.get();
            if (!cur.exists) {
                res.status(404).json({ error: { code: 404, message: "Not Found" } });
                return;
            }
            // 409: 楽観ロック
            const curUpdated = cur.get("updatedAt");
            if (parsed.expectedUpdatedAt && curUpdated) {
                const expected = new Date(parsed.expectedUpdatedAt).getTime();
                const actual = curUpdated.toDate().getTime();
                if (expected !== actual) {
                    res.status(409).json({
                        error: {
                            code: 409,
                            message: "Conflict: newer version exists",
                            current: { updatedAt: curUpdated.toDate().toISOString() }
                        }
                    });
                    return;
                }
            }
            const key = `compositions:PUT:${userId}:${id}:${(parsed.updatedAt || "")}`;
            if ((0, _util_1.seen)(key)) {
                res.status(200).json({ deduped: true });
                return;
            }
            const data = {
                ...parsed,
                compositionId: id,
                createdAt: cur.get("createdAt") || _admin_1.admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: _admin_1.admin.firestore.FieldValue.serverTimestamp(),
            };
            await ref.set(data, { merge: false });
            const saved = await ref.get();
            res.json((0, _util_1.docToJson)(saved.data()));
            return;
        }
        // DELETE（削除）
        if (req.method === "DELETE" && id) {
            const ref = col.doc(id);
            const cur = await ref.get();
            if (!cur.exists) {
                res.status(404).json({ error: { code: 404, message: "Not Found" } });
                return;
            }
            await ref.delete();
            res.status(204).end();
            return;
        }
        res.status(405).json({ error: { code: 405, message: "Method Not Allowed" } });
    }
    catch (e) {
        res.status(500).json({ error: { code: 500, message: String(e?.message || e) } });
    }
});
