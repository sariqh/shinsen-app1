// 参照: 03/12.5, 04/6, 08 KPI イベント
export type CoreEvent =
  | "signup_complete"
  | "choose_A"
  | "choose_B"
  | "choose_C"
  | "ocr_batch_start"
  | "ocr_batch_done"
  | "assets_confirmed"
  | "composition_start"
  | "first_composition_save"
  | "export_image"
  | "export_csv"
  | "ocr_correction_edit"
  | "export_menu_open"
  | "save_retry"
  | "offline_resync"
  | "composition_open"
  | "assets_open";

export function track(event: CoreEvent, payload?: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify({ event, payload, ts: Date.now() })], { type: "application/json" });
    // NOTE: MVP ダミー実装。将来 SW リトライ（参照: 08/送信方式）
    navigator.sendBeacon?.("/__collect", blob);
  } catch {}
}

