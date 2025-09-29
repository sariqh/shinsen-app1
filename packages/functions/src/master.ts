import { onRequest } from "firebase-functions/v2/https";
import { db } from "./_admin";

export const master = onRequest(async (req, res) => {
  try {
    if (req.path.endsWith("/master/warlords")) {
      const s = await db.collection("warlords").orderBy("numericId").get();
      res.json(s.docs.map(d => d.data()));
      return;
    }
    if (req.path.endsWith("/master/skills")) {
      const s = await db.collection("skills").orderBy("numericId").get();
      res.json(s.docs.map(d => d.data()));
      return;
    }
    if (req.path.endsWith("/master/tactics")) {
      const s = await db.collection("tactics").orderBy("tacticId").get();
      res.json(s.docs.map(d => d.data()));
      return;
    }
    res.status(404).json({ error: { code: 404, message: "Not Found" } });
    return;
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: { code: 500, message: e?.message || String(e) } });
    return;
  }
});
