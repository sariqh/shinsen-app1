"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.F = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// Emulator でも本番でも一度だけ初期化
(0, app_1.initializeApp)();
// 使い回すインスタンス
exports.db = (0, firestore_1.getFirestore)();
// FieldValue ショートハンド
exports.F = firestore_1.FieldValue;
