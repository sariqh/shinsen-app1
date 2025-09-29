"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.master = void 0;
const https_1 = require("firebase-functions/v2/https");
const _admin_1 = require("./_admin");
exports.master = (0, https_1.onRequest)(async (req, res) => {
    try {
        if (req.path.endsWith("/master/warlords")) {
            const s = await _admin_1.db.collection("warlords").orderBy("numericId").get();
            res.json(s.docs.map(d => d.data()));
            return;
        }
        if (req.path.endsWith("/master/skills")) {
            const s = await _admin_1.db.collection("skills").orderBy("numericId").get();
            res.json(s.docs.map(d => d.data()));
            return;
        }
        if (req.path.endsWith("/master/tactics")) {
            const s = await _admin_1.db.collection("tactics").orderBy("tacticId").get();
            res.json(s.docs.map(d => d.data()));
            return;
        }
        res.status(404).json({ error: { code: 404, message: "Not Found" } });
        return;
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: { code: 500, message: e?.message || String(e) } });
        return;
    }
});
