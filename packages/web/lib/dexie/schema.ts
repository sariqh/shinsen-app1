import Dexie, { Table } from "dexie";

// ==== Tables ====
export interface DraftComposition {
  id: string;               // compositionId or local temp id
  data: any;                // Composition JSON (schemas/composition.ts)
  updatedAt: number;        // epoch ms
}

export interface ViewState {
  id: "global";
  scale: number;            // 0.75 | 1.0 | 1.25 (MVP固定)
  panX: number;
  panY: number;
  ownershipAware: boolean;  // パレットの「所有物考慮」トグル
}

export type MasterKey = "warlords" | "skills" | "tactics";
export interface MasterCache {
  key: MasterKey;
  payload: any;             // マスター配列
  etag?: string;            // If-None-Match 用
  updatedAt: number;        // epoch ms
}

export class AppDB extends Dexie {
  drafts!: Table<DraftComposition, string>;
  viewState!: Table<ViewState, string>;
  masterCache!: Table<MasterCache, string>;

  constructor() {
    super("shinsen_db");
    this.version(1).stores({
      drafts: "id, updatedAt",
      viewState: "id",
      masterCache: "key, updatedAt",
    });
  }
}

export const db = new AppDB();

// ==== Draft helpers ====
const now = () => Date.now();

/** 500msデバウンスの外で呼ぶことを想定（03/11） */
export async function saveDraft(id: string, data: any) {
  await db.drafts.put({ id, data, updatedAt: now() });
}
export async function getDraft<T=any>(id: string): Promise<T | null> {
  const d = await db.drafts.get(id);
  return (d?.data ?? null) as T | null;
}
export async function deleteDraft(id: string) {
  await db.drafts.delete(id);
}

// ==== View helpers ====
export async function getView(): Promise<ViewState> {
  return (await db.viewState.get("global")) ?? {
    id: "global",
    scale: 1,
    panX: 0,
    panY: 0,
    ownershipAware: true,
  };
}
export async function setView(patch: Partial<ViewState>) {
  const v = await getView();
  await db.viewState.put({ ...v, ...patch });
}

// ==== Master cache ====
export async function cacheMaster(key: MasterKey, payload: any, etag?: string) {
  await db.masterCache.put({ key, payload, etag, updatedAt: now() });
}
export async function getMaster<T=any>(key: MasterKey): Promise<{payload:T|null, etag?:string}> {
  const m = await db.masterCache.get(key);
  return { payload: (m?.payload ?? null) as T | null, etag: m?.etag };
}
export async function clearStale(maxAgeMs: number = 1000 * 60 * 60 * 24 * 7) { // 7days
  const threshold = now() - maxAgeMs;
  await db.transaction('rw', db.drafts, db.masterCache, async () => {
    await db.drafts.where('updatedAt').below(threshold).delete();
    await db.masterCache.where('updatedAt').below(threshold).delete();
  });
}