import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { env } from "@/src/lib/env";

// 参照: 05/1, セキュリティ 01/4.2、エミュ接続は環境変数で切替
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "1") {
  // NOTE: 非対話で動くよう try/catch 抑止（未起動でもビルド継続）
  try { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); } catch {}
  try { connectFirestoreEmulator(db, "127.0.0.1", 8080); } catch {}
}

