import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Emulator でも本番でも一度だけ初期化
initializeApp();

// 使い回すインスタンス
export const db = getFirestore();
// FieldValue ショートハンド
export const F = FieldValue;
