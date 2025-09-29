"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.master = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
const _util_1 = require("./_util");
// ルーティング：/master/:kind で warlords | skills | tactics を返す
exports.master = (0, https_1.onRequest)(async (req, res) => {
    try {
        if (req.method !== "GET") {
            res.status(405).json({ error: { code: 405, message: "Method Not Allowed" } });
            return;
        }
        // パス例: /master/warlords
        const [, base, kind] = (req.path || "").split("/");
        if (base !== "master" || !kind) {
            res.status(404).json({ error: { code: 404, message: "Not Found" } });
            return;
        }
        const col = _admin_1.db.collection(kind); // warlords | skills | tactics
        const snap = await col.orderBy("numericId", "asc").get().catch(async () => await col.get());
        const list = snap.docs.map(d => ({ ...(0, _util_1.docToJson)(d.data()) }));
        res.json(list);
    }
    catch (e) {
        res.status(500).json({ error: { code: 500, message: String(e?.message || e) } });
    }
});
