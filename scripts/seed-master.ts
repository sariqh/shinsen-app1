import * as fs from "fs";
import * as path from "path";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "shinsen-app1" });
const db = getFirestore();
const csv = (p: string) => fs.readFileSync(p, "utf-8").trim().split("\n").map(l=>l.split(","));

async function up() {
  const root = process.cwd();
  { // warlords
    const [_, ...rows] = csv(path.join(root, "warlords.csv"));
    const b = db.batch();
    for (const [warlordId,name,rarity,camp,cost,uniqueSkillId,numericId] of rows) {
      b.set(db.collection("warlords").doc(warlordId), {
        warlordId,name, rarity:+rarity, camp:+camp, cost:+cost, uniqueSkillId,
        numericId:+(numericId||0), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
      });
    }
    await b.commit(); console.log(`warlords: ${rows.length} upserted`);
  }
  { // skills
    const [_, ...rows] = csv(path.join(root, "skills.csv"));
    const b = db.batch();
    for (const [skillId,name,rarity,type,displayGroup,inheritedSkill,useLimit,numericId] of rows) {
      b.set(db.collection("skills").doc(skillId), {
        skillId,name, rarity:+rarity, type:+type, displayGroup:+displayGroup,
        inheritedSkill:/true/i.test(inheritedSkill||""), useLimit:+(useLimit||1), numericId:+(numericId||0),
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
      });
    }
    await b.commit(); console.log(`skills: ${rows.length} upserted`);
  }
  { // tactics
    const [_, ...rows] = csv(path.join(root, "tactics.csv"));
    const b = db.batch();
    for (const [tacticId,name,category] of rows) {
      b.set(db.collection("tactics").doc(tacticId), {
        tacticId,name, category:+category,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
      });
    }
    await b.commit(); console.log(`tactics: ${rows.length} upserted`);
  }
}
up().then(()=>console.log("done")).catch(e=>{console.error(e);process.exit(1);});
