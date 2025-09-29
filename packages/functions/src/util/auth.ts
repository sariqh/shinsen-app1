
import * as admin from "firebase-admin";
import { Request } from "firebase-functions/v2/https";

export function ensureApp() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin;
}

export function getUid(req: Request): string | null {
  // Accept Firebase Auth via Authorization: Bearer <idToken>
  const authHeader = req.get("Authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return null; // For simplicity in emulator; real prod should verifyIdToken(m[1])
}
