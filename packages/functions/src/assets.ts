import { onRequest } from "firebase-functions/v2/https";
import { db, F } from "./_admin";
import { z } from "zod";
import { AssetSchema } from "./schemas/assets";
import { toISO } from "./_util";

const pathSchema = z.object({ userId: z.string().min(1) });

export const assets = onRequest(async (req, res) => {
  try {
    const m = req.path.match(/\/users\/([^/]+)\/assets\/?$/);
    if (!m) { res.status(400).json({ error: { code: 400, message: "Bad path. expected /users/{userId}/assets" } }); return; }
    const { userId } = pathSchema.parse({ userId: decodeURIComponent(m[1]) });
    const ref = db.collection("users").doc(userId).collection("assets").doc("current");

    if (req.method === "GET") {
      const snap = await ref.get();
      if (!snap.exists) { res.json({}); return; }
      const d = snap.data()!;
      res.json({ ...d, createdAt: toISO(d.createdAt), updatedAt: toISO(d.updatedAt) });
      return;
    }

    if (req.method === "POST") {
      const body = AssetSchema.parse(req.body ?? {});
      const current = await ref.get();
      const data = {
        ...body,
        createdAt: current.exists ? current.get("createdAt") : F.serverTimestamp(),
        updatedAt: F.serverTimestamp(),
      };
      await ref.set(data, { merge: false });
      const saved = await ref.get();
      const d = saved.data()!;
      res.json({ ...d, createdAt: toISO(d.createdAt), updatedAt: toISO(d.updatedAt) });
      return;
    }

    res.status(405).json({ error: { code: 405, message: "Method Not Allowed" } });
    return;
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: { code: 500, message: e?.message || String(e) } });
    return;
  }
});
